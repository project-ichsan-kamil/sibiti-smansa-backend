import { Controller, Get, Param, Body } from '@nestjs/common';
import { Post } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService : AuthService,
    ){}

    @Get("verify/:token")
    async getStatusUser(@Param("token") token: string){
        try {
            const getStatusUser = await this.authService.getStatusUser(token)
            return getStatusUser;
        } catch (error) { 
            throw error  
        }
    }

    @Post('verify')
    async verifyUser(@Body() body: { token: string }): Promise<any> {
        try {
            const token = body.token;
            return await this.authService.verifyUser(token)
        } catch (error) {
           throw error; 
        }
    }

    @Post('login')
    async login(@Body() body: { email: string, password : string }): Promise<any> {
        try {
            var {email, password} = body;
            return await this.authService.login(email, password)
        } catch (error) {
           throw error; 
        }
    }

    @Post("forgot-password")
    async forgotPassword(@Body() body:{ email : string}){
        try {
            const {email} = body;
            return await this.authService.forgotPassword(email)
        } catch (error) {
            throw error;
        }
   }

   @Post("change-password")
   async changePassword(@Body() body : { token : string, newPassword : string}){
    try {
        const {token, newPassword} = body;
        return await this.authService.changePassword(token, newPassword);
    } catch (error) {
        throw error;
    }
   }
}
