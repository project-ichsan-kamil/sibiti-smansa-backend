import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsBoolean, MaxLength } from 'class-validator';

export class BaseEditExamDto {
  
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingGrade?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  shareExam?: boolean;
}
