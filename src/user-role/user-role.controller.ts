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
    @Roles(UserRoleEnum.SUPER_ADMIN)
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
