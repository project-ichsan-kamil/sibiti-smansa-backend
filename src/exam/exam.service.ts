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
  this.logger.log(`${executor} Starting exam creation`);

  const queryRunner = this.examRepository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {

    let otherExam = null;
    // Validasi sameAsOtherExam
    if (createQuisDailyExamDto.sameAsOtherExam) {
      if (!createQuisDailyExamDto.otherExamId) {
        throw new Error('otherExamId is required when sameAsOtherExam is true.');
      }

      otherExam = await this.examRepository.findOne({
        where: { id: createQuisDailyExamDto.otherExamId, statusData : true },
      });

      if (!otherExam) {
        throw new Error('Referenced exam not found.');
      }

      if (otherExam.statusExam === StatusExam.WAITING_SUBMITTER) {
        throw new Error('Referenced exam is in invalid state.');
      }

      this.logger.log(`${executor} Valid referenced exam found, proceeding to copy questions.`);
    }

    // Validasi data umum ujian
    const { subject, owner } = await this.validateCommonExamData(createQuisDailyExamDto, currentUser, queryRunner);

    // Tentukan status ujian berdasarkan sameAsOtherExam
    const statusExam = createQuisDailyExamDto.sameAsOtherExam
      ? StatusExam.DRAFT
      : StatusExam.WAITING_SUBMITTER;

    // Membuat entitas ujian
    const exam = queryRunner.manager.create(Exam, {
      ...createQuisDailyExamDto,
      startDate: new Date(createQuisDailyExamDto.startDate),
      owner: owner,
      statusExam,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
      subject: subject,
      submitter: owner,
      otherExam: otherExam
    });

    // Simpan ujian ke database
    const savedExam = await queryRunner.manager.save(exam);

    // Salin soal dan opsi jika sameAsOtherExam bernilai true
    if (createQuisDailyExamDto.sameAsOtherExam) {
      const otherExam = await this.examRepository.findOne({
        where: { id: createQuisDailyExamDto.otherExamId },
        relations: ['questions'],
      });

      const copiedQuestions = otherExam.questions.map((question) => {
        const newQuestion = queryRunner.manager.create(Question, {
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
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        return newQuestion;
      });

      // Simpan soal yang sudah disalin ke database
      await queryRunner.manager.save(copiedQuestions);
      this.logger.log(`${executor} Copied questions associated with new exam.`);
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
    this.logger.log(`${executor} Transaction committed successfully.`);
    this.logger.log(`${executor} Exam created successfully with ID: ${savedExam.id}`);

    
    return savedExam;
  } catch (error) {
    this.logger.error(`${executor} Error during exam creation: ${error.message}`);
    // Rollback transaksi jika terjadi kesalahan
    await queryRunner.rollbackTransaction();
    throw new HttpException(
      error.message || 'Error during exam creation',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  } finally {
    // Rilis query runner
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
