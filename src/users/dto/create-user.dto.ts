import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {

    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    noHp: string;

    @IsNotEmpty()
    fullName: string;

    @IsNotEmpty()
    password: string;

    @IsOptional()
    classId: number;

}
