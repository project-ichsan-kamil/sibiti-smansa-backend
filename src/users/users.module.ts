import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { ProfileUserService } from 'src/profile-user/profile-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ProfileUser])],
  controllers: [UsersController],
  providers: [UsersService, ProfileUserService],
})
export class UsersModule {}
