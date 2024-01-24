import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ProfileUserService } from 'src/profile-user/profile-user.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private userProfileService : ProfileUserService
  ) {}

  //create user
  async create(createUserDto: CreateUserDto) {
    const existUser = await this.findByEmail(createUserDto.email);
    if (existUser) {
      throw new HttpException({
        message : ["email already exists"],
      }, HttpStatus.BAD_REQUEST);
    }

    const user = this.usersRepository.create(createUserDto)
    
    try {
      const createdUser = await this.usersRepository.save(user)
      
      await this.userProfileService.create({
        userId: createdUser.id,
        email : createdUser.email,
        username : createdUser.username
      });

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

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

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
