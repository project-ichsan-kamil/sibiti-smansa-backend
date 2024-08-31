import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes,
  Patch,
} from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from './enum/user-role.enum';
import { UpdateUserRoleGuruDto } from './dto/update-user-role.dto';

@Controller('user-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post('create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @UsePipes(ValidationPipe)
  async createRole(@Body() createRoleDto: CreateUserRoleDto, @Req() req) {
    const currentUser = req.user;

    const newRole = await this.userRoleService.createRole(
      createRoleDto.role,
      createRoleDto.userId,
      createRoleDto.subjectId,
      currentUser,
    );
    return {
      statusCode: 201,
      message: 'Role berhasil ditambahkan.',
      data: newRole,
    };
  }

  @Get()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async getRoleById(@Query('roleId') roleId: number, @Req() req: any) {
    const currentUser = req.user;
    const role = await this.userRoleService.getRoleById(roleId, currentUser);
    return {
      statusCode: 200,
      message: 'Role berhasil ditemukan.',
      data: role,
    };
  }

  @Get('list-admins')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async getListAdmins(@Req() req, @Query('name') name: string) {
      const currentUser = req.user;
      const admins = await this.userRoleService.getListAdmin(currentUser, name);
      return {
          statusCode: 200,
          message: 'Daftar Admin berhasil ditemukan.',
          count: admins.length,
          data: admins,
      };
  }


  @Get('list-guru')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async getListGuru(@Req() req: any, @Query('name') name?: string) {
    const currentUser = req.user;
    const gurus = await this.userRoleService.getListGuru(currentUser, name);
    return {
      statusCode: 200,
      message: 'Daftar Guru berhasil ditemukan.',
      count: gurus.length,
      data: gurus,
    };
  }

  @Get('search')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async getListUserByFullNameAndRole(
    @Req() req: any,
    @Query('fullName') fullName: string,
    @Query('role') role: UserRoleEnum,
  ) {
    const users = await this.userRoleService.getListUserByFullNameAndRole(
      fullName,
      role,
      req.user,
    );
    return {
      statusCode: 200,
      message: `Daftar pengguna dengan role berhasil ditemukan.`,
      count: users.length,
      data: users,
    };
  }

  @Delete('guru')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async deactivateGuruRole(@Query('roleId') roleId: number, @Req() req: any) {
    const currentUser = req.user;
    await this.userRoleService.deactivateGuruRole(roleId, currentUser);
    return {
      statusCode: 200,
      message: 'Role Guru berhasil dihapus.',
    };
  }

  @Delete('admin')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async deactivateAdminRole(@Query('roleId') roleId: number, @Req() req: any) {
    const currentUser = req.user;
    await this.userRoleService.deactivateAdminRole(roleId, currentUser);
    return {
      statusCode: 200,
      message: 'Role Admin berhasil dihapus.',
    };
  }

  @Patch('guru')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @UsePipes(ValidationPipe)
  async updateGuruSubject(
    @Body() updateUserRoleGuruDto: UpdateUserRoleGuruDto,
    @Req() req: any,
  ) {
    const { roleId, newSubjectId } = updateUserRoleGuruDto;
    const currentUser = req.user;
    const updatedRole = await this.userRoleService.updateGuruSubject(
      roleId,
      newSubjectId,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'Mata pelajaran untuk role Guru berhasil diperbarui.',
      data: updatedRole,
    };
  }
}
