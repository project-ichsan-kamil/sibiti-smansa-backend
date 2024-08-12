import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { ParticipantExamService } from 'src/participant-exam/participant-exam.service';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly participantExamService: ParticipantExamService,
  ) {}

  async createExam(createExamDto: CreateExamDto, currentUser: any): Promise<Exam> {
    const executor = `[${currentUser.fullName}][createExam]`;
    this.logger.log(`${executor} Starting exam creation`);

    // Check if exam with the same name already exists
    const existingExam = await this.examRepository.findOne({ where: { name: createExamDto.name, statusData: true } });
    if (existingExam) {
      this.logger.error(`${executor} Exam with the same name already exists`);
      throw new HttpException('An exam with the same name already exists', HttpStatus.BAD_REQUEST);
    }

    // Validate start date
    if (new Date(createExamDto.startDate) < new Date()) {
      this.logger.error(`${executor} Start date is in the past`);
      throw new HttpException('The start date cannot be in the past', HttpStatus.BAD_REQUEST);
    }

    // Validate passing grade
    if (createExamDto.passingGrade > 100) {
      this.logger.error(`${executor} Passing grade cannot exceed 100`);
      throw new HttpException('Passing grade cannot exceed 100', HttpStatus.BAD_REQUEST);
    }

    // Check if submitter is the owner
    if (createExamDto.submitterId && createExamDto.submitterId !== createExamDto.ownerId) {
      this.logger.error(`${executor} Submitter is not the owner`);
      throw new HttpException('Submitter must be the owner', HttpStatus.BAD_REQUEST);
    }

    // Create the exam entity
    const exam = this.examRepository.create(createExamDto);
    exam.owner = currentUser;
    exam.createdBy = currentUser.fullName;
    exam.updatedBy = currentUser.fullName;

    const savedExam = await this.examRepository.save(exam);
    this.logger.log(`${executor} Exam created successfully`);

    // Delegate ParticipantExam creation to the ParticipantExamService
    await this.participantExamService.createParticipantExams(createExamDto, savedExam, currentUser);

    return savedExam;
  }
}
