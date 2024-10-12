import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { Exam } from './entities/exam.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';
import { ParticipantExamService } from 'src/participant-exam/participant-exam.service';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';
import { Question } from 'src/question/entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ParticipantExam, Class, Users, Question])],
  controllers: [ExamController],
  providers: [ExamService, ParticipantExamService],
})
export class ExamModule {}
