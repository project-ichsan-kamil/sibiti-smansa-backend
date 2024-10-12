import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParticipantExam } from './entities/participant-exam.entity';
import { Exam } from '../exam/entities/exam.entity';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';
import { ParticipantType } from '../exam/enum/exam.enum';
import { BaseExamDto } from 'src/exam/dto/create-base-exam.dto';

@Injectable()
export class ParticipantExamService {
  private readonly logger = new Logger(ParticipantExamService.name);

  constructor() {}

  async createParticipantExams(
    exam: Exam,
    createExamDto: BaseExamDto,
    currentUser: any,
    manager: EntityManager,
  ): Promise<void> {
    const executor = `[${currentUser.fullName}][createParticipantExams]`;

    try {
      if (createExamDto.participantType === ParticipantType.CLASS) {
        if (!createExamDto.classIds) {
          this.logger.error(`${executor} classIds are required for CLASS participant type`);
          throw new HttpException('classIds are required for CLASS participant type', HttpStatus.BAD_REQUEST);
        }

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
        if (!createExamDto.userIds) {
          this.logger.error(`${executor} userIds are required for USER participant type`);
          throw new HttpException('userIds are required for USER participant type', HttpStatus.BAD_REQUEST);
        }

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
    } catch (error) {
      this.logger.error(`${executor} Error in createParticipantExams: ${error.message}`);
      throw new HttpException(error.message || 'Error during participant exam creation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
