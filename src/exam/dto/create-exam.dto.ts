import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  IsDate,
  IsPositive,
} from 'class-validator';
import { ExamType, ExamDuration, SumOption, SumQuestion, StatusExam, ParticipantType } from '../enum/exam.enum';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ExamType)
  @IsNotEmpty()
  type: ExamType;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsString()
  @IsPositive()
  time: string;

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
  @IsPositive()
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

  @IsOptional()
  @IsInt()
  otherExamId?: number;

  @IsInt()
  @IsNotEmpty()
  ownerId: number;

  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @IsInt()
  @IsNotEmpty()
  submitterId: number;
}
