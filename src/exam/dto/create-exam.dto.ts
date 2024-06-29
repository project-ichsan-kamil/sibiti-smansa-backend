// create-exam.dto.ts
import { IsString, IsInt, IsDate, IsArray, IsNotEmpty } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  examType: string;

  @IsString()
  @IsNotEmpty()
  subject: number;

  @IsDate()
  @IsNotEmpty()
  startDate: string;

  @IsDate()
  @IsNotEmpty()
  endDate: string;

  @IsInt()
  @IsNotEmpty()
  duration: number;

  @IsInt()
  @IsNotEmpty()
  numberOfQuestions: number;

  @IsInt()
  @IsNotEmpty()
  numberOfOptions: number;

  @IsString()
  @IsNotEmpty()
  participantType: string;

  @IsArray()
  @IsNotEmpty()
  participants: string[];

  @IsInt()
  @IsNotEmpty()
  totalScore: number;

  @IsInt()
  @IsNotEmpty()
  passingScore: number;

  @IsString()
  @IsNotEmpty()
  examStatus: string;
}
