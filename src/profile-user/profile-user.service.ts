import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileUserDto } from './dto/create-profile-user.dto';
import { ProfileUser } from './entities/profile-user.entity'
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';

@Injectable()
export class ProfileUserService {
  constructor(
    @InjectRepository(ProfileUser)
    private profileUserRepository : Repository<ProfileUser>,
  ){}

  //create user profile
  async create(createProfileUserDto: CreateProfileUserDto) {
    const userProfile = await this.findByEmail(createProfileUserDto.email);

    if(userProfile){
      throw new HttpException("The user profile already exists", HttpStatus.BAD_REQUEST);
    }

    const profile = {
      id : new Date().valueOf(),
      userId : createProfileUserDto.userId,
      username : createProfileUserDto.username,
      email : createProfileUserDto.email
    }

    try {
      return await this.profileUserRepository.save(profile);
    } catch (error) {
      throw error
    }
  }

  //get all user profile
  async findAll() {
    try {
      const userProfile = await this.profileUserRepository.find()
      if(!userProfile.length){
        throw new HttpException("Users Profile Empty", HttpStatus.BAD_REQUEST);
      }
      return userProfile;
    } catch (error) {
      throw error;
    }
  }

  //get user profile by id
  async findOne(id: number) {
    try {
      const userProfile = await this.profileUserRepository.findOne({ where : {id}})
      if(!userProfile){
        throw new HttpException("User Profile Empty ", HttpStatus.BAD_REQUEST);
      }
      return userProfile
    } catch (error) {
      throw error
    }
  }

  // update user profile
  // async update(id: number, updateProfileUserDto: UpdateProfileUserDto) {
  //   const userProfile = await this.findOne(id);

  //   if (!userProfile) {
  //       throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
  //   }

  //   userProfile.username = updateProfileUserDto.username || userProfile.username;
  //   userProfile.email = updateProfileUserDto.email || userProfile.email;
  //   userProfile.noHp = updateProfileUserDto.noHp !== undefined ? updateProfileUserDto.noHp : userProfile.noHp;
  //   userProfile.sekolah = updateProfileUserDto.sekolah !== undefined ? updateProfileUserDto.sekolah : userProfile.sekolah;
  //   userProfile.provinsi = updateProfileUserDto.provinsi !== undefined ? updateProfileUserDto.provinsi : userProfile.provinsi;
  //   userProfile.kota = updateProfileUserDto.kota !== undefined ? updateProfileUserDto.kota : userProfile.kota;
  //   userProfile.kelurahan = updateProfileUserDto.kelurahan !== undefined ? updateProfileUserDto.kelurahan : userProfile.kelurahan;

  //   try {
  //       return await this.profileUserRepository.update(id, userProfile);
  //   } catch (error) {
  //       throw error;
  //   }
  // }

  async update(id: number, updateProfileUserDto: UpdateProfileUserDto) {
    const userProfile = await this.findOne(id);

    if (!userProfile) {
        throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
    }

    userProfile.username = updateProfileUserDto.username || userProfile.username;
    userProfile.email = updateProfileUserDto.email || userProfile.email;
    userProfile.noHp = updateProfileUserDto.noHp !== undefined ? updateProfileUserDto.noHp : userProfile.noHp;
    userProfile.sekolah = updateProfileUserDto.sekolah !== undefined ? updateProfileUserDto.sekolah : userProfile.sekolah;
    userProfile.provinsi = updateProfileUserDto.provinsi !== undefined ? updateProfileUserDto.provinsi : userProfile.provinsi;
    userProfile.kota = updateProfileUserDto.kota !== undefined ? updateProfileUserDto.kota : userProfile.kota;
    userProfile.kelurahan = updateProfileUserDto.kelurahan !== undefined ? updateProfileUserDto.kelurahan : userProfile.kelurahan;

    try {
         await this.profileUserRepository.update(id, userProfile);
         return this.findOne(id)
    } catch (error) {
        throw error;
    }
}


  

  //delete user profile
  async remove(id: number) {
    try {
      await this.profileUserRepository.delete(id)
    } catch (error) {
      throw error
    }
  }

  async findByEmail( email : string){
    return await this.profileUserRepository.findOne({where : {email}})
  }
}
