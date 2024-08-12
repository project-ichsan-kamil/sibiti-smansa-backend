import { Module } from '@nestjs/common';
import { ParticipantExamService } from './participant-exam.service';
import { ParticipantExamController } from './participant-exam.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantExam } from './entities/participant-exam.entity';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipantExam, Class, Users])],
  controllers: [ParticipantExamController],
  providers: [ParticipantExamService],
})
export class ParticipantExamModule {}
