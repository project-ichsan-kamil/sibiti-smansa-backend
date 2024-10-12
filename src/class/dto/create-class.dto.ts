import { IsNotEmpty, isNumber, IsNumber, IsString } from 'class-validator';

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    nama: string;

    @IsNumber()
    @IsNotEmpty()
    kelas: number;

    @IsNumber()
    @IsNotEmpty()
    status: number;
}
