import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class verifyUserDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

}
