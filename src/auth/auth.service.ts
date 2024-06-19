const jwt = require('jsonwebtoken');
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ){}

    //feature verification user
    async getStatusUser(token : string){
        try {
            const decodedToken = await this.verifyJwtToken(token); 

            const user = await this.findUserById(decodedToken.userId)

            return {
                token,
                isVerified : user.isVerified
            }
        } catch (error) { 
            throw error  
        }
    }

    async verifyUser(token : string){
         try {
            const decodedToken = await this.verifyJwtToken(token);
            
            // Retrieve user by userId
            const user = await this.findUserById(decodedToken.userId);

            // Check if the user is already verified
            if (user.isVerified) {
                throw new HttpException('User is already verified', HttpStatus.BAD_REQUEST);
            }

            // Update user's isVerified status to true
            user.isVerified = true;
            await this.usersRepository.save(user);

            return { message : "User verified successfully"}
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return { error: 'Invalid token' };
            }
            throw error;
        }
    }


    //feature login
    async login(email: string, password: string): Promise<any> {
        try {
            // Retrieve user by username            
            const user = await this.findUserByEmail(email);

            // Check if password is correct
            const isPasswordValid = await this.validatePassword(user, password);
            if (!isPasswordValid) {
                throw new HttpException({
                    errorField: true,
                    nameField: 'password',
                    errorAllert: false,
                    message: 'Invalid password',
                  }, HttpStatus.UNAUTHORIZED);
            }

            // Check if the user is verified
            if (!user.isVerified) {
                throw new HttpException('User is not verified', HttpStatus.UNAUTHORIZED);
            }

            // Generate and return JWT token
            const token = await this.generateToken(user.id.toString());
            return { 
                token: token, 
                email : user.email,
                username : user.username,
                // role : user.role
            };
        } catch (error) {
            throw error;
        }
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return await bcrypt.compare(password, user.password);
    }


    

    //feature forgot password
    async forgotPassword(email : string){
        try {
            const user = await this.findUserByEmail(email)
            
            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            const token = await this.generateToken(user.id.toString())

            await this.sendEmailForgotPassword(user.email, token);

            return {message : 'Email forgot password send successfully'}
        } catch (error) {
            console.log("Error forgot password");
            throw error;
        }
    }




    //feature change password
    async changePassword(token : string, newPassword : string){
        try {
            const decodedToken = await this.verifyJwtToken(token);

            const user = await this.findUserById(decodedToken.userId);

            user.password = await bcrypt.hash(newPassword, 10);

            await this.usersRepository.save(user);

            return {email : user.email , message : "Change Password Successfully"}
            
        } catch (error) {
            console.log("Error change password");
            throw error;
        }
    }



    // user service
    async findUserById(id : number){
        try {
            const user = await this.usersRepository.findOne({ where: { id } });

            if (!user) {
              throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

      async findUserByEmail(email: string): Promise<User> {
        try {
          const user = await this.usersRepository.findOneByOrFail({ email });
          return user;
        } catch (error) {
            throw new HttpException({
                errorField: true,
                nameField: 'email',
                errorAllert: false,
                message: 'User not found',
              }, HttpStatus.NOT_FOUND);
        }
      }


    //token function
    async generateToken(userId: string) {
        try {
            const payload = { userId: userId};
            const token = jwt.sign(payload, process.env.JWT_SECRECT ,{expiresIn: '24h'});
            return token;
        } catch (error) {
            console.log("Error generate token : ", error);
            throw new Error("Failed to generate token");    
        }
       
    }

    async verifyJwtToken(token: string){
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRECT);
            return decoded;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }




    //email function
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const subject = 'Account Verification';
        const verificationLink =  `${process.env.BASE_URL}/verify?token=${token}`;
        const html = `<p>Click the following link to verify your account:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`; //TODO change body email
    
        try {
          await this.sendEmail(email, subject, html);
        } catch (error) {
          console.error('Error sending verification email:', error);
          throw new HttpException('Failed to send verification email', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }

      async sendEmailForgotPassword(email: string, token: string): Promise<void> {
        const subject = 'Forgot Password';
        const verificationLink =  `${process.env.BASE_URL}/forgot-password?token=${token}`;
        const html = `<p>Click the following link to change your password</p><p><a href="${verificationLink}">${verificationLink}</a></p>`; //TODO change body email forgot password
    
        try {
          await this.sendEmail(email, subject, html);
        } catch (error) {
          console.error('Error sending forgot password email:', error);
          throw new HttpException('Failed to send forgot password email', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
      
      public async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
          const mailOptions = {
            from: 'eurekademy@gmail.com', 
            to,
            subject,
            html
          };
    
          await this.transporter.sendMail(mailOptions);
          console.log(`Email sent to ${to} successfully.`);
        } catch (error) {
          console.error('Error sending email:', error);
          throw error;
        }
      }

      private transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'fajrulichsan0208@gmail.com',  //TODO buat email baru
          pass: 'xoty evqi sghp uxtj' 
        }
    
      });

}
