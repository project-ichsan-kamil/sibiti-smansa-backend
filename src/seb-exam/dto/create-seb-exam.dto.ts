import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSebExamDto {
  @IsInt()
  @IsNotEmpty()
  examId: number;
}
