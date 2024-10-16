import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { ProfileUserService } from 'src/profile-user/profile-user.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { EmailService } from 'src/common/email/email.service';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserRoleService } from 'src/user-role/user-role.service';
import { Subject } from 'rxjs';
import { Class } from 'src/class/entities/class.entity';
import { Setting } from 'src/settings/entities/setting.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Users, ProfileUser, UserRole, Subject, Class, Setting])],
  controllers: [UsersController],
  providers: [UserService, ProfileUserService, EncryptionService, EmailService, UserRoleService],
})
export class UsersModule {}
