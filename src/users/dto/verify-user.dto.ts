import { IsNotEmpty } from 'class-validator';

export class verifyUserDto {
    @IsNotEmpty()
    userId: number;
}
