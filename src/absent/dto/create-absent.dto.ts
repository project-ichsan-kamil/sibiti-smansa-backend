import { IsNotEmpty, IsOptional, IsEnum, IsString, IsDateString, Matches, IsInt } from 'class-validator';
import { StatusAbsent } from '../enum/absent.enum';

export class CreateAbsentDto { 

  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  @IsEnum(StatusAbsent, { message: 'Status must be a valid enum value' })
  status: StatusAbsent;

  @IsOptional()
  @IsString()
  notes: string;
}

