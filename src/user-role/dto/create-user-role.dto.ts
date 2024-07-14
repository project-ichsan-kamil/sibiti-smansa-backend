import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserRoleDto {
    @IsNotEmpty()
    userId: number;

    @IsNotEmpty()
    role: string;

    @IsOptional()
    subjectId?: number;
}