import { IsEnum, IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { ExamType } from '../enum/exam.enum';
import { BaseExamDto } from './create-base-exam.dto';

export class CreateUasUtsDto extends BaseExamDto {
  @IsEnum(ExamType, { message: 'Exam type must be UTS or UAS only' })
  @IsIn([ExamType.UTS, ExamType.UAS], {
    message: 'Exam type must be UTS or UAS only',
  })
  type: ExamType;

  @IsInt()
  @IsNotEmpty()
  submitterId: number;
}
