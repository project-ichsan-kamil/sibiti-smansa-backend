import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserRoleDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsString()
    role: string;
}