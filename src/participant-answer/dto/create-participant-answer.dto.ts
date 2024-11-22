import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateParticipantAnswerDto {
  @IsNotEmpty()
  examId: number;
}
