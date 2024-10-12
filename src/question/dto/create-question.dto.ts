import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateQuestionDto {
  @IsInt()
  @IsNotEmpty()
  examId: number;
}
