import { IsString, IsNotEmpty, IsEnum, IsInt, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { ExamDuration, ExamType, ParticipantType, StatusExam, SumOption, SumQuestion } from '../enum/exam.enum';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ExamType)
  type: ExamType;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

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

  @IsBoolean()
  @IsNotEmpty()
  randomize: boolean;

  @IsEnum(StatusExam)
  @IsNotEmpty()
  statusExam: StatusExam;

  @IsEnum(ParticipantType)
  @IsNotEmpty()
  participantType: ParticipantType;

  @IsBoolean()
  @IsNotEmpty()
  sameAsOtherExam: boolean;

  @IsBoolean()
  @IsNotEmpty()
  shareExam: boolean;

  @IsString()
  @IsOptional()
  submitterId?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  classIds?: string;  // Comma-separated string of class IDs

  @IsString()
  @IsOptional()
  userIds?: string;   // Comma-separated string of user IDs
}
