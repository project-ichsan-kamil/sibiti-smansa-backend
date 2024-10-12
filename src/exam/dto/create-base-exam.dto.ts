import { IsString, IsNotEmpty, IsEnum, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { ExamDuration, ParticipantType, SumOption, SumQuestion } from '../enum/exam.enum';

export class BaseExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsEnum(ExamDuration)
  @IsNotEmpty()
  duration: ExamDuration;

  @IsEnum(SumQuestion)
  @IsNotEmpty()
  sumQuestion: SumQuestion;

  @IsEnum(SumOption)
  @IsNotEmpty()
  sumOption: SumOption;

  @IsInt()
  @IsNotEmpty()
  passingGrade: number;

  @IsNotEmpty()
  subjectId: number;

  @IsBoolean()
  @IsNotEmpty()
  randomize: boolean;

  @IsEnum(ParticipantType)
  @IsNotEmpty()
  participantType: ParticipantType;

  @IsBoolean()
  @IsNotEmpty()
  shareExam: boolean;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  classIds?: string;  

  @IsString()
  @IsOptional()
  userIds?: string;   
}
