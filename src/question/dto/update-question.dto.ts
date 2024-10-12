import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { AnswerKey } from '../enum/question.enum';

export class UpdateQuestionDto {
  @IsInt()
  @IsNotEmpty()
  examId: number;

  @IsInt()
  @IsNotEmpty()
  questionNumber: number;

  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  A?: string;

  @IsString()
  @IsOptional()
  B?: string;

  @IsString()
  @IsOptional()
  C?: string;

  @IsString()
  @IsOptional()
  D?: string;

  @IsString()
  @IsOptional()
  E?: string;

  @IsString()
  @IsOptional()
  F?: string;

  @IsEnum(AnswerKey)
  @IsNotEmpty()
  key: AnswerKey;
}
