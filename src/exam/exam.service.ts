import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { ParticipantExamService } from '../participant-exam/participant-exam.service';
import { StatusExam } from './enum/exam.enum';
import { Subject } from 'src/subject/entities/subject.entity';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly participantExamService: ParticipantExamService,
  ) {}

  async createExam(
    createExamDto: CreateExamDto,
    currentUser: any,
  ): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExam]`;
    this.logger.log(`${executor} Starting exam creation`);

    const queryRunner =
      this.examRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if exam with the same name already exists
      const existingExam = await queryRunner.manager.findOne(Exam, {
        where: { name: createExamDto.name, statusData: true },
      });
      if (existingExam) {
        this.logger.error(`${executor} Exam with the same name already exists`);
        throw new HttpException(
          'An exam with the same name already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Convert startDate string to Date object
      const startDate = new Date(createExamDto.startDate);
      if (isNaN(startDate.getTime())) {
        this.logger.error(`${executor} Invalid start date`);
        throw new HttpException(
          'Invalid start date format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate passing grade
      if (createExamDto.passingGrade > 100) {
        this.logger.error(`${executor} Passing grade cannot exceed 100`);
        throw new HttpException(
          'Passing grade cannot exceed 100',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if subject exists
      const subject = await queryRunner.manager.findOne(Subject, {
        where: { id: createExamDto.subjectId, statusData: true },
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

      // If sameAsOtherExam is true, validate the otherExamId
      let otherExam = null;
      if (createExamDto.sameAsOtherExam) {
        if (!createExamDto.otherExamId) {
          this.logger.error(
            `${executor} otherExamId is required when sameAsOtherExam is true`,
          );
          throw new HttpException(
            'otherExamId is required when sameAsOtherExam is true',
            HttpStatus.BAD_REQUEST,
          );
        }

        otherExam = await queryRunner.manager.findOne(Exam, {
          where: { id: createExamDto.otherExamId, statusData: true },
        });
        if (
          !otherExam ||
          ![StatusExam.PUBLISH, StatusExam.CLOSE, StatusExam.SHOW].includes(
            otherExam.statusExam,
          )
        ) {
          this.logger.error(
            `${executor} The referenced exam is either not found or not in a valid state (PUBLISH, CLOSE, SHOW)`,
          );
          throw new HttpException(
            'The referenced exam is either not found or not in a valid state (PUBLISH, CLOSE, SHOW)',
            HttpStatus.BAD_REQUEST,
          );
        }

        // If sameAsOtherExam is true and otherExamId is valid, set statusExam to SHOW
        createExamDto.statusExam = StatusExam.SHOW;
      }

      // Set statusExam to DRAFT initially if sameAsOtherExam is false
      if (!createExamDto.sameAsOtherExam) {
        createExamDto.statusExam = StatusExam.DRAFT;
      }

      const exam = queryRunner.manager.create(Exam, {
        ...createExamDto,
        startDate,
        owner: owner,
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
        subject: subject, // Associate the subject
        submitter: owner, // Associate the submitter
        otherExam: otherExam, // Associate the other exam if applicable
      });

      const savedExam = await queryRunner.manager.save(exam);
      this.logger.log(`${executor} Exam created successfully`);

      // Handle ParticipantExam creation
      await this.participantExamService.createParticipantExams(
        savedExam,
        createExamDto,
        currentUser,
        queryRunner.manager,
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return savedExam;
    } catch (error) {
      this.logger.error(
        `${executor} Error during exam creation: ${error.message}`,
      );

      // Rollback the transaction in case of errors
      await queryRunner.rollbackTransaction();

      throw new HttpException(
        error.message || 'Error during exam creation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner after transaction is complete
      await queryRunner.release();
    }
  }
}
