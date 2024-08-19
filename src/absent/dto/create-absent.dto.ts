import { IsNotEmpty, IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { StatusAbsent } from '../enum/absent.enum';

export class CreateAbsentDto {
  @IsNotEmpty()
  userId: number;

  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsDateString()
  time: Date;

  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  @IsEnum(StatusAbsent)
  status: StatusAbsent;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  photoLink: string;
}
