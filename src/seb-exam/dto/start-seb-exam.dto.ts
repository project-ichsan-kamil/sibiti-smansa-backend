import { IsString, IsNotEmpty } from 'class-validator';

export class StartExamDto {
    @IsString()
    @IsNotEmpty()
    password: string;
}
