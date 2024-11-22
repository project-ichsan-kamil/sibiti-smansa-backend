import { IsString, IsNotEmpty } from 'class-validator';

export class ExitExamDto {
    @IsString()
    @IsNotEmpty()
    exitCode: string;
}
