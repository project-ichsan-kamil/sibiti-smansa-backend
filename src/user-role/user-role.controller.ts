import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, UseGuards, Delete, Patch } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';

@Controller('user-role')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async create(@Body() createUserRoleDto: CreateUserRoleDto) {
    const result = await this.userRoleService.create(createUserRoleDto);
    return {
      statusCode: 201,
      message: 'Data berhasil disimpan',
      data: result,
    }
  }

  @Get('role/:role')
  @UseGuards(JwtAuthGuard)
  async findAllByRole(@Param('role') role: string) {
    const result = await this.userRoleService.findAllByRole(role);
    return {
      statusCode: 200,
      message: 'Data berhasil ditemukan',
      data: result,
    }
  }

  @Delete(':userRoleId')
  @UseGuards(JwtAuthGuard)
  async deleteRole(@Param('userRoleId') userRoleId: number) {
    const result = await this.userRoleService.deleteRole(userRoleId);
    return {
      statusCode: 200,
      message: 'Data berhasil dihapus',
      data: result,
    }
  }
}

