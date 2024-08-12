import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ParticipantExam } from './entities/participant-exam.entity';
import { Exam } from '../exam/entities/exam.entity';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';
import { ParticipantType } from '../exam/enum/exam.enum';
import { CreateExamDto } from '../exam/dto/create-exam.dto';

@Injectable()
export class ParticipantExamService {
  private readonly logger = new Logger(ParticipantExamService.name);

  constructor() {}

  async createParticipantExams(
    exam: Exam,
    createExamDto: CreateExamDto,
    currentUser: any,
    manager: EntityManager,
  ): Promise<void> {
    const executor = `[${currentUser.fullName}][createParticipantExams]`;

    if (createExamDto.participantType === ParticipantType.CLASS) {
      const classIds = createExamDto.classIds.split(',').map(id => parseInt(id.trim()));

      for (const classId of classIds) {
        const classEntity = await manager.findOne(Class, { where: { id: classId, statusData: true } });
        if (!classEntity) {
          this.logger.error(`${executor} Class with ID ${classId} not found or inactive`);
          throw new HttpException(`Class with ID ${classId} not found or inactive`, HttpStatus.BAD_REQUEST);
        }

        const participantExam = manager.create(ParticipantExam, {
          exam,
          participantType: ParticipantType.CLASS,
          class: classEntity,
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        await manager.save(participantExam);
      }
      this.logger.log(`${executor} ParticipantExam(s) created for class(es)`);
    } 

    if (createExamDto.participantType === ParticipantType.USER) {
      const userIds = createExamDto.userIds.split(',').map(id => parseInt(id.trim()));

      for (const userId of userIds) {
        const user = await manager.findOne(Users, { where: { id: userId, statusData: true, isVerified: true } });
        if (!user) {
          this.logger.error(`${executor} User with ID ${userId} not found or not verified`);
          throw new HttpException(`User with ID ${userId} not found or not verified`, HttpStatus.BAD_REQUEST);
        }

        const participantExam = manager.create(ParticipantExam, {
          exam,
          participantType: ParticipantType.USER,
          user,
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        await manager.save(participantExam);
      }
      this.logger.log(`${executor} ParticipantExam(s) created for user(s)`);
    }
  }
}
