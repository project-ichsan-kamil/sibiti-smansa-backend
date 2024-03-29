import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ProfileUserService } from 'src/profile-user/profile-user.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly userProfileService : ProfileUserService,
    private readonly authService : AuthService,
  ) {}

  //create user
  async create(createUserDto: CreateUserDto) {
    const existUser = await this.findByEmail(createUserDto.email);
    if (existUser) {
      throw new HttpException({
        errorField: true,
        nameField: 'email',
        errorAllert: false,
        message: 'email already exists',
      }, HttpStatus.BAD_REQUEST);
    }

    const user = this.usersRepository.create(createUserDto)
    
    try {

      const createdUser = await this.usersRepository.save(user)
      
      const userProfile = await this.userProfileService.create({
        userId: createdUser.id,
        email : createdUser.email,
        username : createdUser.username
      });

      const token = await this.authService.generateToken(createdUser.id.toString());

      try {
        await this.authService.sendVerificationEmail(createdUser.email, token);
      } catch (emailError) {

        // Hapus pengguna yang baru saja dibuat
        await this.usersRepository.delete(createdUser.id);
        await this.userProfileService.remove(userProfile.id)

        throw new HttpException({
          message: 'Error sending verification email',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
        
      }

      return createdUser;
    } catch (error) {
      throw error;
    }
  }

  //get all user
  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    
    if (!users.length) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.usersRepository.find();
  }

  //get user by id
  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async remove(id: number) {
    try {
      await this.usersRepository.delete(id);
    } catch (error) {
      throw error;
    }
  }

  async findByEmail( email : string){
    return await this.usersRepository.findOne({where : {email}})
  }



}
