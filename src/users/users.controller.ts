import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Req, Get } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async createUser(@Body() createUserDto: CreateUserDto){
        const result =  await this.userService.createUser(createUserDto);
        return {
            statusCode: 201,
            message: 'User berhasil dibuat',
            data: result,
        }
    }
}
