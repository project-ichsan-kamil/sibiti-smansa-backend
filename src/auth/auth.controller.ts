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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt/jwt.auth.guard';

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
        maxAge: 3600000,
      }); //TODO seacrh max session
      return res
        .status(HttpStatus.OK)
        .send({ statusCode: 200, message: 'Login successful' });
    } catch (error) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ message: error.message });
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) // Pastikan pengguna terautentikasi
  async getMe(@Req() req) {
    return req.user; // req.user diset oleh middleware/jwt guard
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard) // Pastikan pengguna terautentikasi
  async logout(@Res() res: Response,  @Req() req) {
    const currentUser = req.user;

    // Menghapus token dari cookies
    res.clearCookie('token'); // Hapus token cookie

    this.logger.log(`[logout] Logout successful for user : '${currentUser?.fullName}'`);
    return res
      .status(HttpStatus.OK)
      .send({ statusCode: 200, message: 'Logout successful' });
  }
}
