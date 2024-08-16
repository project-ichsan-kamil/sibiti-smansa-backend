import { IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ExamType } from "../enum/exam.enum";
import { BaseExamDto } from "./create-base-exam.dto";

export class CreateQuizDailyExamDto extends BaseExamDto {

  @IsEnum(ExamType, { message: 'Tipe exam hanya boleh UTS atau UAS' })
  @IsIn([ExamType.KUIS, ExamType.UH], { message: 'Tipe exam hanya boleh UTS atau UAS' })
  type: ExamType;

  @IsBoolean()
  @IsNotEmpty()
  sameAsOtherExam: boolean;

  @IsInt()
  @IsOptional()
  otherExamId?: number;
}