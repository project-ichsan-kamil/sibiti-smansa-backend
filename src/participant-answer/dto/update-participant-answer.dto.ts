import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';

export class UpdateParticipantAnswerDto {
  @IsNotEmpty()
  @IsNumber()
  examId: number;

  @IsNotEmpty()
  @IsNumber()
  no: number; // Nomor soal

  @IsNotEmpty()
  @IsString()
  ans: string; // Jawaban baru

  @IsNotEmpty()
  @IsBoolean()
  hst: boolean; // Status terjawab (true atau false)
}
