import { Module } from '@nestjs/common';
import { ParticipantExamService } from './participant-exam.service';
import { ParticipantExamController } from './participant-exam.controller';

@Module({
  controllers: [ParticipantExamController],
  providers: [ParticipantExamService],
})
export class ParticipantExamModule {}
