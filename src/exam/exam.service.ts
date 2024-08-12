import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { Users } from 'src/users/entities/user.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createExamDto: CreateExamDto, currentUser: any): Promise<Exam> {
    const executor = `[${currentUser.fullName}][create]`;
    this.logger.log(`${executor} Creating a new exam`);

    // Validate owner
    const owner = await this.userRepository.findOne({
      where: { id: createExamDto.ownerId, statusData: true, isVerified: true },
    });

    if (!owner) {
      this.logger.error(`${executor} Owner not found or not verified`);
      throw new HttpException('Pemilik ujian tidak ditemukan atau belum diverifikasi', HttpStatus.NOT_FOUND);
    }

    // Validate subject
    const subject = await this.subjectRepository.findOne({
      where: { id: createExamDto.subjectId, statusData: true },
    });

    if (!subject) {
      this.logger.error(`${executor} Subject not found`);
      throw new HttpException('Mata pelajaran tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Validate submitter
    const submitter = await this.userRepository.findOne({
      where: { id: createExamDto.submitterId, statusData: true, isVerified: true },
    });

    if (!submitter) {
      this.logger.error(`${executor} Submitter not found or not verified`);
      throw new HttpException('Pengumpul ujian tidak ditemukan atau belum diverifikasi', HttpStatus.NOT_FOUND);
    }

    // Create a new exam
    const newExam = this.examRepository.create({
      ...createExamDto,
      owner,
      subject,
      submitterId: submitter,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
    });

    const savedExam = await this.examRepository.save(newExam);
    this.logger.log(`${executor} Exam created successfully`);
    return savedExam;
  }

  // Other methods (find, update, delete, etc.) can be added here
}