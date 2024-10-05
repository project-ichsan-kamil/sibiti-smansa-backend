import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Req,
  Logger,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt/jwt.auth.guard';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const { token } = await this.authService.login(loginDto);
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });
      return res
        .status(HttpStatus.OK)
        .send({ statusCode: 200, message: 'Login successful' });
    } catch (error) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ message: error.message });
    }
  }

  @Post('forgot-password')
  @UsePipes(ValidationPipe)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<any> {
    const result = await this.authService.sendResetPasswordEmail(forgotPasswordDto.email);
    return {
      statusCode: HttpStatus.OK,
      message: 'Link reset password telah dikirim ke email Anda.',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response, @Req() req) {
    const currentUser = req.user;

    // Menghapus token dari cookies
    res.clearCookie('token'); // Hapus token cookie

    this.logger.log(
      `[logout] Logout successful for user : '${currentUser?.fullName}'`,
    );
    return res
      .status(HttpStatus.OK)
      .send({ statusCode: 200, message: 'Logout successful' });
  }
}
