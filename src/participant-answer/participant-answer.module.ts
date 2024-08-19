import { Module } from '@nestjs/common';
import { ParticipantAnswerService } from './participant-answer.service';
import { ParticipantAnswerController } from './participant-answer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { UserClass } from 'src/class/entities/user-class.entity';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipantAnswer, Exam, UserClass, ParticipantExam])],
  controllers: [ParticipantAnswerController],
  providers: [ParticipantAnswerService],
})
export class ParticipantAnswerModule {}
