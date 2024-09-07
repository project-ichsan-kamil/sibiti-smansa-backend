import { Multer } from 'multer';
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Get,
  Param,
  ParseIntPipe,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  ParseArrayPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UsePipes(ValidationPipe)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.createUser(
      createUserDto,
      currentUser,
    );
    return {
      statusCode: 201,
      message: 'User berhasil dibuat',
      data: result,
    };
  }

  @Post('verify')
  @UsePipes(ValidationPipe)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async verifyUsers(
    @Query('userIds', new ParseArrayPipe({ items: Number, separator: ',' }))
    userIds: number[],
    @Req() req,
  ) {
    const currentUser = req.user;
    const result = await this.userService.verifyUsers(userIds, currentUser);

    return {
      statusCode: 200,
      message:
      result.length > 0
        ? 'User berhasil diverifikasi'
        : 'Tidak ada user yang diverifikasi',
      count: result.length,
      verifiedUsers: result,
    };
  }

  @Post('unverify')
  @UsePipes(ValidationPipe)
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async unverifyUsers(
    @Query('userIds', new ParseArrayPipe({ items: Number, separator: ',' }))
    userIds: number[],
    @Req() req,
  ) {
    const currentUser = req.user;
    const result = await this.userService.inActivateUsers(userIds, currentUser);

    return {
      statusCode: 200,
      message:
        result.length > 0
          ? 'User(s) successfully deactivated'
          : 'No users were deactivated',
      count: result.length,
      data: result,
    };
  }

  @Get('get-user')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async getUserByUserId(@Query('userId') userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getUserByUserId(userId, currentUser);
    return {
      statusCode: 200,
      message: 'User found successfully',
      data: result,
    };
  }

  @Get('user-unverified')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async getUnverifiedUsers(@Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getUnverifiedUsers(currentUser);
    return {
      statusCode: 200,
      message: 'Unverified users found successfully',
      count: result.length,
      data: result,
    };
  }

  @Get('user-verified')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async getVerifiedUsers(@Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getVerifiedUsers(currentUser);
    return {
      statusCode: 200,
      message: 'Verified users found successfully',
      count: result.length,
      data: result,
    };
  }

  @Delete('delete')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async deleteUser(@Query('userId', ParseIntPipe) userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.deleteUser(userId, currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil di hapus',
      data: result,
    };
  }

  @Get('search')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async searchUserByFullName(
    @Query('fullName') fullName: string,
    @Query('isVerified') isVerified: boolean,
    @Req() req,
  ) {
    const currentUser = req.user;
    const result = await this.userService.searchUserByFullName(
      fullName,
      isVerified,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'User(s) found successfully',
      count: result.length,
      data: result,
    };
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Multer.File, @Req() req) {
    const currentUser = req.user;
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const result = await this.userService.createUserFormTemplateExcel(
      file,
      currentUser,
    );
    return result;
  }

  @Get('unassigned-verified-users')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async getUnassignedVerifiedUsers(@Req() req) {
    const currentUser = req.user;
    const result =
      await this.userService.getUnassignedVerifiedUsers(currentUser);
    return {
      statusCode: 200,
      message: 'Verified users not assigned to any class found successfully',
      count: result.length,
      data: result,
    };
  }
}
