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
import { count } from 'console';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
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
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
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
          ? 'User(s) berhasil diverifikasi'
          : 'Tidak ada pengguna yang diverifikasi',
      count: result.length,
      verifiedUsers: result,
    };
  }

  @Post('unverify')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
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
          ? 'User(s) berhasil dinonaktifkan'
          : 'Tidak ada pengguna yang dinonaktifkan',
      count : result.length,
      data: result,
    };
  }

  @Get('get-user')
  @UseGuards(JwtAuthGuard)
  async getUserByUserId(@Query('userId') userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getUserByUserId(userId, currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil di temukan',
      data: result,
    };
  }

  @Get('user-unverified')
  @UseGuards(JwtAuthGuard)
  async getUnverifiedUsers(@Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getUnverifiedUsers(currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count: result.length,
      data: result,
    };
  }

  @Get('user-verified')
  @UseGuards(JwtAuthGuard)
  async getVerifiedUsers(@Req() req) {
    const currentUser = req.user;
    const result = await this.userService.getVerifiedUsers(currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count: result.length,
      data: result,
    };
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Query('userId', ParseIntPipe) userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.deleteUser(userId, currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil dihapus',
      data: result,
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUserByFullName(@Query('fullName') fullName: string, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.searchUserByFullName(
      fullName,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count: result.length,
      data: result,
    };
  }

  @Post('upload-excel')
  @UseGuards(JwtAuthGuard)
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
}
