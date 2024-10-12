import { IsNotEmpty, IsNumber } from 'class-validator';

export class CompleteExamDto {
  @IsNotEmpty()
  @IsNumber()
  examId: number;
}
