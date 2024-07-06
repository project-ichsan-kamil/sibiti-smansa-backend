import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { ProfileUserService } from 'src/profile-user/profile-user.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';


@Module({
  imports: [TypeOrmModule.forFeature([Users, ProfileUser])],
  controllers: [UsersController],
  providers: [UserService, ProfileUserService, EncryptionService],
})
export class UsersModule {}
