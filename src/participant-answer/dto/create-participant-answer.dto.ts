import { IsNotEmpty, IsArray, IsString, IsOptional } from 'class-validator';

export class CreateParticipantAnswerDto {
  @IsNotEmpty()
  examId: number;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

}
