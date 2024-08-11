import { IsNotEmpty } from 'class-validator';

export class UpdateUserRoleGuruDto {
  @IsNotEmpty()
  roleId: number;

  @IsNotEmpty()
  newSubjectId: number;
}
