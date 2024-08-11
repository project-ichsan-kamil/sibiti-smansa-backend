import { Controller, Post, Body, Param, Delete, Get, Query, UseGuards, Req, ValidationPipe, UsePipes } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from './enum/user-role.enum';

@Controller('user-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserRoleController {
    constructor(private readonly userRoleService: UserRoleService) {}

    @Post('create')
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
    @UsePipes(ValidationPipe)
    async createRole(
        @Body() createRoleDto: CreateUserRoleDto,
        @Req() req,
    ) {
        const currentUser = req.user;
        
        const newRole = await this.userRoleService.createRole(
            createRoleDto.role,
            createRoleDto.userId,
            createRoleDto.subjectId,
            currentUser,
        );
        return {
            statusCode: 201,
            message: 'Role created successfully',
            data: newRole,
        };
    }

    @Get()
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
    async getRoleById(
      @Query('roleId') roleId: number,
      @Req() req: any,
    ) {
      const currentUser = req.user;
      const role = await this.userRoleService.getRoleById(roleId, currentUser);
      return {
        statusCode: 200,
        message: `Role with ID: ${roleId} fetched successfully`,
        data: role,
      };
    }

    @Get('list-admins')
    @Roles(UserRoleEnum.SUPER_ADMIN)
    async getListAdmins(@Req() req){
        const currentUser = req.user;
        const admins = await this.userRoleService.getListAdmin(currentUser);
        return {
            statusCode: 200,
            message: 'Admins retrieved successfully',
            count: admins.length,
            data: admins,
        };
    }

    @Get('list-guru')
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
    async getListGuru(@Req() req: any) {
      const currentUser = req.user;
      const gurus = await this.userRoleService.getListGuru(currentUser);
      return {
        statusCode: 200,
        message: 'Daftar Guru berhasil diambil',
        count : gurus.length,
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
      const users = await this.userRoleService.getListUserByFullNameAndRole(fullName, role, req.user);
      return {
        statusCode: 200,
        message: `Daftar pengguna dengan peran ${role} berhasil diambil`,
        count : users.length,
        data: users,
      };
    }

    @Delete('guru')
    @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
    async deactivateGuruRole(
      @Query('roleId') roleId: number,
      @Req() req: any,
    ) {
      const currentUser = req.user;
      await this.userRoleService.deactivateGuruRole(roleId, currentUser);
      return {
        statusCode: 200,
        message: `Guru role with ID: ${roleId} deactivated successfully`,
      };
    }
  
    @Delete('admin')
    @Roles(UserRoleEnum.SUPER_ADMIN)
    async deactivateAdminRole(
      @Query('roleId') roleId: number,
      @Req() req: any,
    ) {
      const currentUser = req.user;
      await this.userRoleService.deactivateAdminRole(roleId, currentUser);
      return {
        statusCode: 200,
        message: `Admin role with ID: ${roleId} deactivated successfully`,
      };
    }

    // @UseGuards(JwtAuthGuard)
    // @Get('search')
    // async searchUserByFullName(@Query('fullName') fullName: string) {
    //     const users = await this.userRoleService.searchUserByFullName(fullName);
    //     return {
    //         statusCode: 200,
    //         message: 'Users retrieved successfully',
    //         data: users,
    //     };
    // }

    // @UseGuards(JwtAuthGuard)
    // @Delete(':roleId')
    // async deleteRole(@Param('roleId') roleId: number, @Req() req) {
    //     const currentUser = req.user;
    //     await this.userRoleService.deleteRole(roleId, currentUser);
    //     return {
    //         statusCode: 200,
    //         message: 'Role deleted successfully',
    //     };
    // }

    // @UseGuards(JwtAuthGuard)
    // @Get('by-role')
    // async getUsersByRole(@Query('role') role: UserRoleEnum) {
    //     const users = await this.userRoleService.getUsersByRole(role);
    //     return {
    //         statusCode: 200,
    //         message: 'Users retrieved successfully',
    //         data: users,
    //     };
    // }

    // @UseGuards(JwtAuthGuard)
    // @Get(':roleId')
    // async getRoleByRoleId(@Param('roleId') roleId: number) {
    //     const role = await this.userRoleService.getRoleByRoleId(roleId);
    //     return {
    //         statusCode: 200,
    //         message: 'Role retrieved successfully',
    //         data: role,
    //     };
    // }

    // @UseGuards(JwtAuthGuard)
    // @Post('update/:roleId')
    // async updateRole(
    //     @Param('roleId') roleId: number,
    //     @Body() updatedRoleData: Partial<UserRole>,
    //     @Req() req,
    // ) {
    //     const currentUser = req.user;
    //     const updatedRole = await this.userRoleService.updateRole(roleId, updatedRoleData, currentUser);
    //     return {
    //         statusCode: 200,
    //         message: 'Role updated successfully',
    //         data: updatedRole,
    //     };
    // }
}
