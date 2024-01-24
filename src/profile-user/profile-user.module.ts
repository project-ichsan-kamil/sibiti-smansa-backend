import { Module } from '@nestjs/common';
import { ProfileUserService } from './profile-user.service';
import { ProfileUserController } from './profile-user.controller';
import { ProfileUser } from './entities/profile-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileUser])],
  controllers: [ProfileUserController],
  providers: [ProfileUserService],
})
export class ProfileUserModule {}
