import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ParticipantType } from 'src/exam/enum/exam.enum';
export class CreateParticipantExamDto {
  @IsEnum(ParticipantType)
  @IsNotEmpty()
  participantType: ParticipantType;

  @IsString()
  @IsOptional()
  classIds?: string;  
  
  @IsString()
  @IsOptional()
  userIds?: string;   
}
