import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Class } from 'src/class/entities/class.entity';

export class UpdateProfileDto {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString({ each: true })
    class: Class[];

    @IsOptional()
    @IsString()
    fotoProfile: string;

    @IsOptional()
    @IsString()
    noHp: string;

    @IsOptional()
    @IsString()
    provinsi: string;

    @IsOptional()
    @IsString()
    kota: string;

    @IsOptional()
    @IsString()
    kelurahan: string;
}
