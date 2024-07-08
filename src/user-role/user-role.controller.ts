import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, UseGuards, Delete, Patch, Req, Query } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { count } from 'console';

@Controller('user-role')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async create(@Body() createUserRoleDto: CreateUserRoleDto, @Req() req){
    const currentUser = req.user;
    const result = await this.userRoleService.create(createUserRoleDto, currentUser);
    return {
      statusCode: 201,
      message: 'Data berhasil disimpan',
    }
  }

  @Delete(':userRoleId')
  @UseGuards(JwtAuthGuard)
  async deleteRole(@Param('userRoleId') userRoleId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userRoleService.deleteRole(userRoleId, currentUser);
    return {
      statusCode: 200,
      message: 'Data berhasil dihapus',
      data: result,
    }
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchByRoleAndName(@Query('role') role: string, @Query('name') name: string){
    const result = await this.userRoleService.searchByRoleAndName(role, name );
    return {
      statusCode: 200,
      message: 'Data berhasil ditemukan',
      count: result.length,
      data: result,
    }
  }
}

