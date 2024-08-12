import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';
import { CreateParticipantExamDto } from './dto/create-participant-exam.dto';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';
import { ParticipantType } from 'src/exam/enum/exam.enum';
import { Exam } from 'src/exam/entities/exam.entity';

@Injectable()
export class ParticipantExamService {
  private readonly logger = new Logger(ParticipantExamService.name);

  constructor(
    @InjectRepository(ParticipantExam)
    private readonly participantExamRepository: Repository<ParticipantExam>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async createParticipantExams(
    createParticipantExamDto: CreateParticipantExamDto,
    exam: Exam,
    currentUser: any,
  ): Promise<void> {
    const executor = `[${currentUser.fullName}][createParticipantExams]`;
    this.logger.log(`${executor} Starting ParticipantExam creation`);

    if (createParticipantExamDto.participantType === ParticipantType.CLASS) {
      const classIds = createParticipantExamDto.classIds.split(',').map(id => parseInt(id.trim()));

      for (const classId of classIds) {
        const classEntity = await this.classRepository.findOne({ where: { id: classId, statusData: true } });
        if (!classEntity) {
          this.logger.error(`${executor} Class with ID ${classId} not found or inactive`);
          throw new HttpException(`Class with ID ${classId} not found or inactive`, HttpStatus.BAD_REQUEST);
        }

        const participantExam = this.participantExamRepository.create({
          exam: exam,
          participantType: ParticipantType.CLASS,
          class: classEntity,
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        await this.participantExamRepository.save(participantExam);
      }
      this.logger.log(`${executor} ParticipantExam(s) created for class(es)`);
    }

    if (createParticipantExamDto.participantType === ParticipantType.USER) {
      const userIds = createParticipantExamDto.userIds.split(',').map(id => parseInt(id.trim()));

      for (const userId of userIds) {
        const user = await this.userRepository.findOne({ where: { id: userId, statusData: true, isVerified: true } });
        if (!user) {
          this.logger.error(`${executor} User with ID ${userId} not found or not verified`);
          throw new HttpException(`User with ID ${userId} not found or not verified`, HttpStatus.BAD_REQUEST);
        }

        const participantExam = this.participantExamRepository.create({
          exam: exam,
          participantType: ParticipantType.USER,
          user: user,
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        await this.participantExamRepository.save(participantExam);
      }
      this.logger.log(`${executor} ParticipantExam(s) created for user(s)`);
    }
  }

  // Other CRUD methods for ParticipantExam...
}
