import { Controller, Post, Body, Res, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const { token } = await this.authService.login(loginDto);
      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 }); //TODO seacrh max session
      return res.status(HttpStatus.OK).send({ statusCode: 200, message: 'Login successful' });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: error.message });
    }
  }
}
