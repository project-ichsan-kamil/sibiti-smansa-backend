import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
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
import { BaseEditExamDto } from './dto/base-edit-exam.dto';
import { log } from 'console';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);


  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly participantExamService: ParticipantExamService,
    private dataSource: DataSource
  ) {}

  async createExamQuisAndUH(
    createQuisDailyExamDto: CreateQuizDailyExamDto,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExam]`;
    this.logger.log(
      `${executor} Starting exam creation for: ${createQuisDailyExamDto.name}`,
    );

    const queryRunner =
      this.examRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validasi otherExam jika sameAsOtherExam true
      const otherExam = await this.validateOtherExam(
        createQuisDailyExamDto,
        executor,
      );

      // Validasi data umum ujian
      const { subject, owner } = await this.validateCommonExamData(
        createQuisDailyExamDto,
        currentUser,
        queryRunner,
      );

      // Membuat dan menyimpan ujian
      const savedExam = await this.createAndSaveExam(
        createQuisDailyExamDto,
        currentUser,
        owner,
        subject,
        otherExam,
        queryRunner,
        executor,
      );

      // Salin soal dan opsi jika sameAsOtherExam bernilai true
      if (createQuisDailyExamDto.sameAsOtherExam) {
        await this.copyQuestionsFromOtherExam(
          otherExam,
          savedExam,
          queryRunner,
          executor,
        );
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
      this.logger.log(
        `${executor} Transaction committed successfully. Exam ID: ${savedExam.id}, Exam Name: ${savedExam.name}`,
      );

      return savedExam;
    } catch (error) {
      this.logger.error(
        `${executor} Error during exam creation: ${error.message}`,
      );
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Error during exam creation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async createExamUasUts(
    createUasUtsDto: CreateUasUtsDto,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExamUasUts]`;
    this.logger.log(`${executor} - Initiating UAS/UTS exam creation.`);

    const queryRunner =
      this.examRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validasi data umum ujian
      const { subject, owner } = await this.validateCommonExamData(
        createUasUtsDto,
        currentUser,
        queryRunner,
      );
      this.logger.log(`${executor} Common exam data validated successfully`);

      // Validasi submitter sebagai guru yang sah
      const submitter = await this.validateSubmitter(
        createUasUtsDto.submitterId,
        createUasUtsDto.subjectId,
        queryRunner,
        executor,
      );
      this.logger.log(`${executor} Submitter validated successfully`);

      // Membuat entitas ujian UTS/UAS
      const exam = queryRunner.manager.create(Exam, {
        ...createUasUtsDto,
        startDate: new Date(createUasUtsDto.startDate),
        owner: owner,
        sameAsOtherExam: false,
        statusExam: StatusExam.WAITING_SUBMITTER,
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
        subject: subject,
        submitter: submitter,
      });

      // Simpan entitas ujian
      const savedExam = await queryRunner.manager.save(exam);
      this.logger.log(
        `${executor} UAS/UTS exam created successfully. Exam ID: ${savedExam.id}, Name: ${savedExam.name}`,
      );

      // Membuat ujian peserta jika diperlukan
      await this.participantExamService.createParticipantExams(
        savedExam,
        createUasUtsDto,
        currentUser,
        queryRunner.manager,
      );
      this.logger.log(`${executor} Participant exams created successfully`);

      // Komit transaksi
      await queryRunner.commitTransaction();
      this.logger.log(`${executor} Transaction committed successfully`);

      return savedExam;
    } catch (error) {
      this.logger.error(
        `${executor} Error during UAS/UTS exam creation: ${error.message}`,
      );
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        error.message || 'Error during exam creation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async editExamQuisAndUH(
    editQuisDailyExamDto: BaseEditExamDto,
    examId: number,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][editExamQuisAndUH]`;
    this.logger.log(`${executor} Initiating exam edit`);

    // Validasi awal untuk memastikan examId ada
    if (!examId || isNaN(examId)) {
      this.logger.error(`${executor} Invalid or missing examId`);
      throw new HttpException(
        'Invalid or missing exam ID',
        HttpStatus.BAD_REQUEST,
      );
    }

    const exam = await this.examRepository.findOne({
      where: { id: examId, statusData: true },
      relations: ['owner'],
    });

    if (!exam) {
      this.logger.error(`${executor} Exam not found with ID: ${examId}`);
      throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
    }

    // Guru yang menjadi owner yang bisa mengedit
    if (currentUser.id !== exam.owner.id) {
      this.logger.error(
        `${executor} Forbidden: User with role ${currentUser.role} and ID ${currentUser.id} does not have permission to edit exam ID: ${examId}`,
      );
      throw new HttpException(
        'Forbidden: You do not have permission to edit this exam',
        HttpStatus.FORBIDDEN,
      );
    }

    // Pastikan ujian dalam status DRAFT
    if (exam.statusExam !== StatusExam.DRAFT) {
      this.logger.error(
        `${executor} Exam with ID: ${examId} is not in DRAFT status, current status: ${exam.statusExam}`,
      );
      throw new HttpException(
        'Only exams in DRAFT status can be edited',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update fields
    const updatedExam = await this.updateExamFields(
      editQuisDailyExamDto,
      exam,
      currentUser,
      executor,
    );

    // Save updated exam to database
    const savedExam = await this.examRepository.save(updatedExam);
    this.logger.log(
      `${executor} Exam edited successfully. Exam ID: ${savedExam.id}`,
    );

    return savedExam;
  }

  async editExamUasUts(
    editUasUtsDto: BaseEditExamDto,
    examId: number,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][editExamUasUts]`;
    this.logger.log(`${executor} Initiating UAS/UTS exam edit`);

    // Validasi awal untuk memastikan examId ada
    if (!examId || isNaN(examId)) {
      this.logger.error(`${executor} Invalid or missing examId`);
      throw new HttpException(
        'Invalid or missing exam ID',
        HttpStatus.BAD_REQUEST,
      );
    }

    const exam = await this.examRepository.findOne({
      where: { id: examId, statusData: true },
    });

    if (!exam) {
      this.logger.error(`${executor} Exam not found with ID: ${examId}`);
      throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
    }

    // Pastikan ujian dalam status DRAFT
    if (exam.statusExam !== StatusExam.DRAFT) {
      this.logger.error(
        `${executor} Exam with ID: ${examId} is not in DRAFT status, current status: ${exam.statusExam}`,
      );
      throw new HttpException(
        'Only exams in DRAFT status can be edited',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update fields
    const updatedExam = await this.updateExamFields(
      editUasUtsDto,
      exam,
      currentUser,
      executor,
    );

    // Save updated exam to database
    const savedExam = await this.examRepository.save(updatedExam);
    this.logger.log(
      `${executor} UAS/UTS Exam edited successfully. Exam ID: ${savedExam.id}`,
    );

    return savedExam;
  }

  async publishExam(examId: number, currentUser: any, examType: 'QUIZ_UH' | 'UTS_UAS'): Promise<Exam> {
    const executor = `[${currentUser.fullName}][publishExam]`;
  
    try {
      // Log Inisialisasi Publikasi
      this.logger.log(`${executor} Initiating exam publish process for exam ID: ${examId}`);
  
      // Validasi untuk memastikan bahwa examId diberikan dan valid
      if (!examId || isNaN(examId)) {
        this.logger.error(`${executor} Invalid or missing exam ID`);
        throw new HttpException('Invalid or missing exam ID', HttpStatus.BAD_REQUEST);
      }
  
      // Fetch exam by ID
      const exam = await this.examRepository.findOne({
        where: { id: examId, statusData: true },
        relations: ['owner'],
      });
  
      if (!exam) {
        this.logger.error(`${executor} Exam not found with ID: ${examId}`);
        throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
      }
  
      // Validasi Status Ujian
      if (exam.statusExam !== StatusExam.DRAFT) {
        this.logger.error(`${executor} Exam ID: ${examId} is not in DRAFT status. Current status: ${exam.statusExam}`);
        throw new HttpException('Only exams in DRAFT status can be published', HttpStatus.BAD_REQUEST);
      }
  
      if (examType === 'QUIZ_UH') {
        // Memeriksa apakah pengguna memiliki salah satu peran yang diizinkan
        if (!['SUPER_ADMIN', 'ADMIN'].some(role => currentUser.roles.includes(role)) && currentUser.id !== exam.owner.id) {
          this.logger.error(`${executor} Unauthorized publish attempt by user ID: ${currentUser.id} for exam ID: ${examId}`);
          throw new HttpException('You do not have permission to publish this exam', HttpStatus.FORBIDDEN);
        }
      } else if (examType === 'UTS_UAS') {
        // Memeriksa apakah pengguna memiliki peran SuperAdmin atau Admin untuk UTS/UAS
        if (!['SUPER_ADMIN', 'ADMIN'].some(role => currentUser.roles.includes(role))) {          
          this.logger.error(`${executor} Unauthorized UTS/UAS publish attempt by user ID: ${currentUser.id}`);
          throw new HttpException('Only Super Admin and Admin can publish UTS/UAS exams', HttpStatus.FORBIDDEN);
        }
      }
      
      // Ubah Status Menjadi PUBLISHED
      exam.statusExam = StatusExam.PUBLISH;
      const updatedExam = await this.examRepository.save(exam);
  
      // Log Kesuksesan Publikasi
      this.logger.log(`${executor} Exam ID: ${examId} published successfully by user ID: ${currentUser.id}`);
  
      return updatedExam;
  
    } catch (error) {
      this.logger.error(`${executor} Error occurred: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateExamFields(
    editExamDto: BaseEditExamDto,
    exam: Exam,
    currentUser: any,
    executor: string,
  ): Promise<Exam> {
    // Validasi dan Update Nama Ujian
    if (editExamDto.name) {
      const existingExam = await this.examRepository.findOne({
        where: {
          name: editExamDto.name,
          id: Not(exam.id),
          statusData: true,
          type: exam.type,
        },
      });

      if (existingExam) {
        this.logger.error(
          `${executor} Exam name ${editExamDto.name} already exists for another exam`,
        );
        throw new HttpException(
          'Exam name already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      exam.name = editExamDto.name;
      this.logger.log(`${executor} Updated exam name to ${editExamDto.name}`);
    }

    // Validasi dan Update Start Date
    if (editExamDto.startDate) {
      const startDate = new Date(editExamDto.startDate);
      if (isNaN(startDate.getTime()) || startDate < new Date()) {
        this.logger.error(
          `${executor} Invalid start date provided: ${editExamDto.startDate}`,
        );
        throw new HttpException(
          'Invalid start date format or date is in the past',
          HttpStatus.BAD_REQUEST,
        );
      }
      exam.startDate = startDate;
    }

    // Validasi dan Update Passing Grade
    if (editExamDto.passingGrade !== undefined) {
      if (editExamDto.passingGrade < 0 || editExamDto.passingGrade > 100) {
        this.logger.error(
          `${executor} Invalid passing grade: ${editExamDto.passingGrade}`,
        );
        throw new HttpException(
          'Passing grade must be between 0 and 100',
          HttpStatus.BAD_REQUEST,
        );
      }
      exam.passingGrade = editExamDto.passingGrade;
    }

    // Validasi dan Update Duration
    if (editExamDto.duration !== undefined) {
      if (editExamDto.duration <= 0) {
        this.logger.error(
          `${executor} Invalid duration: ${editExamDto.duration}`,
        );
        throw new HttpException(
          'Duration must be a positive number',
          HttpStatus.BAD_REQUEST,
        );
      }
      exam.duration = editExamDto.duration;
    }

    // Validasi dan Update Share Exam
    if (editExamDto.shareExam !== undefined) {
      exam.shareExam = editExamDto.shareExam;
    }

    // Update audit data
    exam.updatedBy = currentUser.fullName;

    this.logger.log(`${executor} Updated exam audit information`);

    return exam;
  }

  async getExamData(params: any, currentUser: any): Promise<any> {
    try {
      // Ambil parameter yang dikirimkan untuk filtering
      const { statusExam, subjectId, examType } = params;            
  
      // Mulai membangun query
      let query = this.examRepository.createQueryBuilder('exam')
        .leftJoinAndSelect('exam.subject', 'subject') // Join tabel subject
        .leftJoinAndSelect('exam.participants', 'participants') // Join tabel participants (ParticipantExam)
        .leftJoinAndSelect('participants.user', 'user') // Join tabel user di dalam ParticipantExam
        .leftJoinAndSelect('participants.class', 'class') // Join tabel class di dalam ParticipantExam
        .leftJoinAndSelect('user.profile', 'profile')
        .where('exam.statusData = :statusData', { statusData: true });
  
      // Jika statusExam disertakan, tambahkan filter statusExam
      if (statusExam) {
        query = query.andWhere('exam.statusExam IN (:...statusExam)', { statusExam });
      }
  
      // Filter berdasarkan ownerId jika user adalah guru (tanpa role admin atau super admin)
      if (
        currentUser.roles.includes(UserRoleEnum.GURU) &&
        !currentUser.roles.includes(UserRoleEnum.ADMIN) &&
        !currentUser.roles.includes(UserRoleEnum.SUPER_ADMIN)
      ) {
        query = query.andWhere('exam.ownerId = :ownerId', { ownerId: currentUser.id });
      }
  
      // Jika subjectId disertakan (opsional)
      if (subjectId) {
        query = query.andWhere('exam.subjectId = :subjectId', { subjectId });
      }
  
      // Filter berdasarkan ExamType jika disertakan
      if (examType) {
        query = query.andWhere('exam.type = :examType', { examType });
      }
  
      const examList = await query.getMany();   
      // Memetakan data exam agar subject dan participants hanya berisi field yang diperlukan
      const simplifiedExamList = examList.map(exam => ({
        ...exam,
        subject: {
          id : exam.subject.id,
          name: exam.subject.name
        },
        participants: exam.participants.map(participant => {
          // Periksa participantType pada exam
          if (exam.participantType === 'CLASS') {
            // Jika participantType adalah 'CLASS', tampilkan data class
            return participant.class ? {
              id: participant.class.id,
              name: participant.class.name,
            } : null;
          } else if (exam.participantType === 'USER') {
            // Jika participantType adalah 'USER', tampilkan data user
            return participant.user ? {
              id: participant.user.id,
              name: participant.user.profile ? participant.user.profile.fullName : null, 
            } : null;
          }
          return null;
        }).filter(participant => participant !== null) // Filter participant yang null
      }));
  
      return simplifiedExamList;
  
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Gagal mengambil data ujian',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Validasi otherExam jika sameAsOtherExam true
  private async validateOtherExam(
    createQuisDailyExamDto: CreateQuizDailyExamDto,
    executor: string,
  ): Promise<Exam | null> {
    if (!createQuisDailyExamDto.sameAsOtherExam) {
      this.logger.log(
        `${executor} sameAsOtherExam is false, skipping otherExam validation`,
      );
      return null;
    }

    if (!createQuisDailyExamDto.otherExamId) {
      this.logger.error(
        `${executor} Validation failed: otherExamId is required when sameAsOtherExam is true.`,
      );
      throw new Error('otherExamId is required when sameAsOtherExam is true.');
    }

    this.logger.log(
      `${executor} Validating referenced exam with ID: ${createQuisDailyExamDto.otherExamId}`,
    );
    const otherExam = await this.examRepository.findOne({
      where: { id: createQuisDailyExamDto.otherExamId, statusData: true },
    });

    if (!otherExam) {
      this.logger.error(
        `${executor} Validation failed: Referenced exam not found. ID: ${createQuisDailyExamDto.otherExamId}`,
      );
      throw new Error('Referenced exam not found.');
    }

    if (otherExam.statusExam === StatusExam.WAITING_SUBMITTER) {
      this.logger.error(
        `${executor} Validation failed: Referenced exam is in invalid state. ID: ${createQuisDailyExamDto.otherExamId}`,
      );
      throw new Error('Referenced exam is in invalid state.');
    }

    this.logger.log(
      `${executor} Referenced exam validated successfully. ID: ${createQuisDailyExamDto.otherExamId}`,
    );
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
    executor: string,
  ): Promise<Exam> {
    this.logger.log(
      `${executor} Creating exam entity for: ${createQuisDailyExamDto.name}`,
    );

    const statusExam = createQuisDailyExamDto.sameAsOtherExam
      ? StatusExam.DRAFT
      : StatusExam.WAITING_SUBMITTER;

    const exam = queryRunner.manager.create(Exam, {
      ...createQuisDailyExamDto,
      startDate: new Date(createQuisDailyExamDto.startDate),
      owner: owner,
      statusExam,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
      subject: subject,
      submitter: owner,
      otherExam: otherExam, // Optional relationship with otherExam
    });

    const savedExam = await queryRunner.manager.save(exam);
    this.logger.log(
      `${executor} Exam created and saved successfully. ID: ${savedExam.id}, Name: ${savedExam.name}, Status: ${savedExam.statusExam}`,
    );
    return savedExam;
  }

  // Salin soal dan opsi dari otherExam
  private async copyQuestionsFromOtherExam(
    otherExam: Exam,
    savedExam: Exam,
    queryRunner: any,
    executor: string,
  ): Promise<void> {
    if (!otherExam) {
      this.logger.error(
        `${executor} No other exam found for copying questions.`,
      );
      throw new Error('No other exam to copy questions from.');
    }

    this.logger.log(
      `${executor} Copying questions from referenced exam ID: ${otherExam.id} to new exam ID: ${savedExam.id}`,
    );

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
    this.logger.log(
      `${executor} ${copiedQuestions.length} questions copied successfully to new exam ID: ${savedExam.id}`,
    );
  }

  private async validateCommonExamData(
    examDto: any,
    currentUser: any,
    queryRunner: any,
  ): Promise<{ subject: Subject; owner: Users }> {
    const executor = `[${currentUser.fullName}][validateCommonExamData]`;

    // Check if exam with the same name already exists
    const existingExam = await queryRunner.manager.findOne(Exam, {
      where: { name: examDto.name, statusData: true },
    });
    if (existingExam) {
      this.logger.error(`${executor} Exam with the same name already exists`);
      throw new HttpException(
        'An exam with the same name already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert startDate string to Date object
    const startDate = new Date(examDto.startDate);
    if (isNaN(startDate.getTime())) {
      this.logger.error(`${executor} Invalid start date`);
      throw new HttpException(
        'Invalid start date format',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate passing grade
    if (examDto.passingGrade > 100) {
      this.logger.error(`${executor} Passing grade cannot exceed 100`);
      throw new HttpException(
        'Passing grade cannot exceed 100',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if subject exists
    const subject = await queryRunner.manager.findOne(Subject, {
      where: { id: examDto.subjectId, statusData: true },
    });
    if (!subject) {
      this.logger.error(`${executor} Subject not found or inactive`);
      throw new HttpException(
        'Subject not found or inactive',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if owner exists and is active
    const owner = await queryRunner.manager.findOne(Users, {
      where: { id: currentUser.id, statusData: true, isVerified: true },
    });
    if (!owner) {
      this.logger.error(`${executor} Owner not found or not verified`);
      throw new HttpException(
        'Owner not found or not verified',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.logger.log(`${executor} - Common exam data validated.`);
    return { subject, owner };
  }

  private async validateSubmitter(
    submitterId: number,
    subjectId: number,
    queryRunner: any,
    executor: string,
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
      this.logger.error(
        `${executor} Submitter with ID ${submitterId} is either not a valid teacher or does not teach the subject`,
      );
      throw new HttpException(
        `Submitter with ID ${submitterId} is either not a valid teacher or does not teach the subject`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return submitterRole.user;
  }
}
