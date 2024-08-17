import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipantAnswerDto } from './create-participant-answer.dto';

export class UpdateParticipantAnswerDto extends PartialType(CreateParticipantAnswerDto) {}
