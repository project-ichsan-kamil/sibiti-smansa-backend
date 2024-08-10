import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { UserRoleEnum } from '../enum/user-role.enum';

export class CreateUserRoleDto {
  @IsEnum(UserRoleEnum)
  @IsNotEmpty()
  role: UserRoleEnum;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsOptional()
  subjectId?: number;
}
