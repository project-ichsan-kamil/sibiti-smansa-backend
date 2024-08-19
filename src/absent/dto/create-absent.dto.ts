import { IsNotEmpty, IsOptional, IsEnum, IsString, IsDateString, Matches } from 'class-validator';
import { StatusAbsent } from '../enum/absent.enum';

export class CreateAbsentDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;  // Tanggal dalam format YYYY-MM-DD

  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in the format HH:mm' })
  time: string;  // Waktu dalam format HH:mm

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

