import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfileUserService } from './profile-user.service';
import { CreateProfileUserDto } from './dto/create-profile-user.dto';
import { UsePipes } from '@nestjs/common/decorators';
import { ValidationPipe } from '@nestjs/common/pipes';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';

@Controller('profile-user')
export class ProfileUserController {
  constructor(private readonly profileUserService: ProfileUserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() createProfileUserDto: CreateProfileUserDto) {
    return this.profileUserService.create(createProfileUserDto);
  }

  @Get()
  findAll() {
    return this.profileUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.profileUserService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateProfileUserDto: UpdateProfileUserDto) {
    return this.profileUserService.update(id, updateProfileUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileUserService.remove(+id);
  }
}
