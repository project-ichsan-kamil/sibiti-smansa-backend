import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipantExamDto } from './create-participant-exam.dto';

export class UpdateParticipantExamDto extends PartialType(CreateParticipantExamDto) {}
