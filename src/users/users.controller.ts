import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Req, Get } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { verifyUserDto } from './dto/verify-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Post('create')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async createUser(@Body() createUserDto: CreateUserDto, @Req() req){
        const userUpdate = req.user.userId;
        const result = await this.userService.createUser(createUserDto, userUpdate);
        return {
            statusCode: 201,
            message: 'User berhasil dibuat',
            data: result,
        }
    }

    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async verifyUser(@Body() verifyUserDto: verifyUserDto, @Req() req){
        const userUpdate = req.user.userId;
        const result = await this.userService.verifyUser(verifyUserDto.userId, userUpdate);
        return {
            statusCode: 200,
            message: 'User berhasil diverifikasi',
            data: result,
        }
    }

    @Post('unverify')   
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async unverifyUser(@Body() verifyUserDto: verifyUserDto, @Req() req){
        const userUpdate = req.user.userId;
        const result = await this.userService.inActiveUser(verifyUserDto.userId, userUpdate);
        return {
            statusCode: 200,
            message: 'User berhasil di nonaktifkan',
            data: result,
        }
    }
}
