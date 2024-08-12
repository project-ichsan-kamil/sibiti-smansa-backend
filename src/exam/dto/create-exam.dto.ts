import { IsString, IsNotEmpty, IsEnum, IsInt, IsBoolean, IsDate, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ExamDuration, ExamType, ParticipantType, StatusExam, SumOption, SumQuestion } from '../enum/exam.enum';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ExamType)
  type: ExamType;

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

  @IsInt()
  @IsNotEmpty()
  subjectId: number;

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

  @IsInt()
  @IsOptional()
  otherExamId?: number;

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
