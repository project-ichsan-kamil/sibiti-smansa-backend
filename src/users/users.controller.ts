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
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { verifyUserDto } from './dto/verify-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.createUser(createUserDto, currentUser);
    return {
      statusCode: 201,
      message: 'User berhasil dibuat',
      data: result,
    };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async verifyUser(@Query('userId', ParseIntPipe) userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.verifyUser(
      userId,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'User berhasil diverifikasi',
    };
  }

  @Post('unverify')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async unverifyUser(@Query("userId") userId : number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.inActiveUser(
      userId,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'User berhasil di nonaktifkan',
      data: result,
    };
  }

  @Get('get-user')
  @UseGuards(JwtAuthGuard)
  async getUserByUserId(@Query('userId') userId: number) {
    const result = await this.userService.getUserByUserId(userId);
    return {
      statusCode: 200,
      message: 'User berhasil di temukan',
      data: result,
    };
  }

  @Get('user-unverified')
  @UseGuards(JwtAuthGuard)
  async getUnverifiedUsers() {
    const result = await this.userService.getUnverifiedUsers();
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count: result.length,
      data: result,
    };
  }

  @Get('user-verified')
  @UseGuards(JwtAuthGuard)
  async getVerifiedUsers() {
    const result = await this.userService.getVerifiedUsers();
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count: result.length,
      data: result,
    };
  }

  @Delete('delete/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('userId', ParseIntPipe) userId: number, @Req() req) {
    const currentUser = req.user;
    const result = await this.userService.deleteUser(userId, currentUser);
    return {
      statusCode: 200,
      message: 'User berhasil dihapus',
      data: result,
    };
  }

  //create function search user by username
  @Get('search/:fullName')
  @UseGuards(JwtAuthGuard)
  async searchUserByFullName(@Param('fullName') fullName: string) {
    const result = await this.userService.searchUserByFullName(fullName);
    return {
      statusCode: 200,
      message: 'User berhasil ditemukan',
      count : result.length,
      data: result,
    };
  }
}
