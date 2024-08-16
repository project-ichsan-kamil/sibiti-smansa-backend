import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateQuizDailyExamDto } from './dto/create-quiz-daily-exam.dto';
import { ParticipantExamService } from '../participant-exam/participant-exam.service';
import { StatusExam } from './enum/exam.enum';
import { Subject } from 'src/subject/entities/subject.entity';
import { Users } from 'src/users/entities/user.entity';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { CreateUasUtsDto } from './dto/create-uas-uts-exam.dto';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { Question } from 'src/question/entities/question.entity';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly participantExamService: ParticipantExamService,
  ) {}

  async createExamQuisAndUH(
    createQuisDailyExamDto: CreateQuizDailyExamDto,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExam]`;
    this.logger.log(`${executor} Starting exam creation for: ${createQuisDailyExamDto.name}`);
  
    const queryRunner = this.examRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // Validasi otherExam jika sameAsOtherExam true
      const otherExam = await this.validateOtherExam(createQuisDailyExamDto, executor);
  
      // Validasi data umum ujian
      const { subject, owner } = await this.validateCommonExamData(createQuisDailyExamDto, currentUser, queryRunner);
  
      // Membuat dan menyimpan ujian
      const savedExam = await this.createAndSaveExam(
        createQuisDailyExamDto, 
        currentUser, 
        owner, 
        subject, 
        otherExam, 
        queryRunner, 
        executor
      );
  
      // Salin soal dan opsi jika sameAsOtherExam bernilai true
      if (createQuisDailyExamDto.sameAsOtherExam) {
        await this.copyQuestionsFromOtherExam(otherExam, savedExam, queryRunner, executor);
      }
  
      // Buat ujian partisipan
      await this.participantExamService.createParticipantExams(
        savedExam,
        createQuisDailyExamDto,
        currentUser,
        queryRunner.manager,
      );
  
      // Komit transaksi jika semua berjalan baik
      await queryRunner.commitTransaction();
      this.logger.log(`${executor} Transaction committed successfully. Exam ID: ${savedExam.id}, Exam Name: ${savedExam.name}`);
  
      return savedExam;
    } catch (error) {
      this.logger.error(`${executor} Error during exam creation: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message || 'Error during exam creation', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  async createExamUasUts(createUasUtsDto: CreateUasUtsDto, currentUser: any): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExam]`;
    this.logger.log(`${executor} Starting UAS/UTS exam creation`);

    const queryRunner = this.examRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const { subject, owner } = await this.validateCommonExamData(createUasUtsDto, currentUser, queryRunner);

      const submitter = await this.validateSubmitter(createUasUtsDto.submitterId, createUasUtsDto.subjectId, queryRunner, executor);

      const exam = queryRunner.manager.create(Exam, {
        ...createUasUtsDto,
        startDate: new Date(createUasUtsDto.startDate),
        owner: owner,
        statusExam: StatusExam.WAITING_SUBMITTER,
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
        subject: subject,
        submitter: submitter, // Associate the submitter
      });

      const savedExam = await queryRunner.manager.save(exam);
      this.logger.log(`${executor} UAS/UTS Exam created successfully`);

      // Handle ParticipantExam creation if needed
      await this.participantExamService.createParticipantExams(
        savedExam,
        createUasUtsDto,
        currentUser,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return savedExam;
    } catch (error) {
      this.logger.error(`${executor} Error during UAS/UTS exam creation: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message || 'Error during exam creation', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
  
  // Validasi otherExam jika sameAsOtherExam true
  private async validateOtherExam(createQuisDailyExamDto: CreateQuizDailyExamDto, executor: string): Promise<Exam | null> {
    if (!createQuisDailyExamDto.sameAsOtherExam) {
      this.logger.log(`${executor} sameAsOtherExam is false, skipping otherExam validation`);
      return null;
    }
  
    if (!createQuisDailyExamDto.otherExamId) {
      this.logger.error(`${executor} Validation failed: otherExamId is required when sameAsOtherExam is true.`);
      throw new Error('otherExamId is required when sameAsOtherExam is true.');
    }
  
    this.logger.log(`${executor} Validating referenced exam with ID: ${createQuisDailyExamDto.otherExamId}`);
    const otherExam = await this.examRepository.findOne({
      where: { id: createQuisDailyExamDto.otherExamId, statusData: true },
    });
  
    if (!otherExam) {
      this.logger.error(`${executor} Validation failed: Referenced exam not found. ID: ${createQuisDailyExamDto.otherExamId}`);
      throw new Error('Referenced exam not found.');
    }
  
    if (otherExam.statusExam === StatusExam.WAITING_SUBMITTER) {
      this.logger.error(`${executor} Validation failed: Referenced exam is in invalid state. ID: ${createQuisDailyExamDto.otherExamId}`);
      throw new Error('Referenced exam is in invalid state.');
    }
  
    this.logger.log(`${executor} Referenced exam validated successfully. ID: ${createQuisDailyExamDto.otherExamId}`);
    return otherExam;
  }
  
  // Membuat dan menyimpan entitas ujian
  private async createAndSaveExam(
    createQuisDailyExamDto: CreateQuizDailyExamDto,
    currentUser: any,
    owner: Users,
    subject: Subject,
    otherExam: Exam | null,
    queryRunner: any,
    executor: string
  ): Promise<Exam> {
    this.logger.log(`${executor} Creating exam entity for: ${createQuisDailyExamDto.name}`);
  
    const statusExam = createQuisDailyExamDto.sameAsOtherExam ? StatusExam.DRAFT : StatusExam.WAITING_SUBMITTER;
  
    const exam = queryRunner.manager.create(Exam, {
      ...createQuisDailyExamDto,
      startDate: new Date(createQuisDailyExamDto.startDate),
      owner: owner,
      statusExam,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
      subject: subject,
      submitter: owner,
      otherExam: otherExam // Optional relationship with otherExam
    });
  
    const savedExam = await queryRunner.manager.save(exam);
    this.logger.log(`${executor} Exam created and saved successfully. ID: ${savedExam.id}, Name: ${savedExam.name}, Status: ${savedExam.statusExam}`);
    return savedExam;
  }
  
  // Salin soal dan opsi dari otherExam
  private async copyQuestionsFromOtherExam(
    otherExam: Exam,
    savedExam: Exam,
    queryRunner: any,
    executor: string
  ): Promise<void> {
    if (!otherExam) {
      this.logger.error(`${executor} No other exam found for copying questions.`);
      throw new Error('No other exam to copy questions from.');
    }
  
    this.logger.log(`${executor} Copying questions from referenced exam ID: ${otherExam.id} to new exam ID: ${savedExam.id}`);
  
    const otherExamWithQuestions = await this.examRepository.findOne({
      where: { id: otherExam.id },
      relations: ['questions'],
    });
  
    const copiedQuestions = otherExamWithQuestions.questions.map((question) => {
      return queryRunner.manager.create(Question, {
        exam: savedExam, // Asosiasi dengan ujian baru
        questionNumber: question.questionNumber,
        question: question.question,
        A: question.A,
        B: question.B,
        C: question.C,
        D: question.D,
        E: question.E,
        F: question.F,
        key: question.key,
        complete: question.complete,
        statusData: question.statusData,
        createdBy: question.createdBy,
        updatedBy: question.updatedBy,
      });
    });
  
    await queryRunner.manager.save(copiedQuestions);
    this.logger.log(`${executor} ${copiedQuestions.length} questions copied successfully to new exam ID: ${savedExam.id}`);
  }


  private async validateCommonExamData(
    examDto: any,
    currentUser: any,
    queryRunner: any
  ): Promise<{ subject: Subject, owner: Users }> {
    const executor = `[${currentUser.fullName}][validateCommonExamData]`;

    // Check if exam with the same name already exists
    const existingExam = await queryRunner.manager.findOne(Exam, {
      where: { name: examDto.name, statusData: true },
    });
    if (existingExam) {
      this.logger.error(`${executor} Exam with the same name already exists`);
      throw new HttpException('An exam with the same name already exists', HttpStatus.BAD_REQUEST);
    }

    // Convert startDate string to Date object
    const startDate = new Date(examDto.startDate);
    if (isNaN(startDate.getTime())) {
      this.logger.error(`${executor} Invalid start date`);
      throw new HttpException('Invalid start date format', HttpStatus.BAD_REQUEST);
    }

    // Validate passing grade
    if (examDto.passingGrade > 100) {
      this.logger.error(`${executor} Passing grade cannot exceed 100`);
      throw new HttpException('Passing grade cannot exceed 100', HttpStatus.BAD_REQUEST);
    }

    // Check if subject exists
    const subject = await queryRunner.manager.findOne(Subject, {
      where: { id: examDto.subjectId, statusData: true },
    });
    if (!subject) {
      this.logger.error(`${executor} Subject not found or inactive`);
      throw new HttpException('Subject not found or inactive', HttpStatus.BAD_REQUEST);
    }

    // Check if owner exists and is active
    const owner = await queryRunner.manager.findOne(Users, {
      where: { id: currentUser.id, statusData: true, isVerified: true },
    });
    if (!owner) {
      this.logger.error(`${executor} Owner not found or not verified`);
      throw new HttpException('Owner not found or not verified', HttpStatus.BAD_REQUEST);
    }

    return { subject, owner };
  }

  private async validateSubmitter(
    submitterId: number,
    subjectId: number,
    queryRunner: any,
    executor: string
  ): Promise<Users> {
    // Validate submitter by checking the user_role table
    const submitterRole = await queryRunner.manager.findOne(UserRole, {
      where: {
        user: { id: submitterId },
        subject: { id: subjectId },
        role: UserRoleEnum.GURU,
        statusData: true,
      },
      relations: ['user', 'subject'],
    });

    if (!submitterRole) {
      this.logger.error(`${executor} Submitter with ID ${submitterId} is either not a valid teacher or does not teach the subject`);
      throw new HttpException(`Submitter with ID ${submitterId} is either not a valid teacher or does not teach the subject`, HttpStatus.BAD_REQUEST);
    }

    return submitterRole.user;
  }
  
}
