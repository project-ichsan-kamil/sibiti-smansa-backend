import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

//create dto
export class UpdateUserDto extends PartialType(CreateUserDto) {}