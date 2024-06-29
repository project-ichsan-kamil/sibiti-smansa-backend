import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { ProfileUserService } from 'src/profile-user/profile-user.service';


@Module({
  imports: [TypeOrmModule.forFeature([Users, ProfileUser])],
  controllers: [UsersController],
  providers: [UserService, ProfileUserService],
})
export class UsersModule {}
