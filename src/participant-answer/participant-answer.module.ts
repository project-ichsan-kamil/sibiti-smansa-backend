import { Module } from '@nestjs/common';
import { ParticipantAnswerService } from './participant-answer.service';
import { ParticipantAnswerController } from './participant-answer.controller';

@Module({
  controllers: [ParticipantAnswerController],
  providers: [ParticipantAnswerService],
})
export class ParticipantAnswerModule {}
