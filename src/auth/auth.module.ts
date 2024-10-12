import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Users } from 'src/users/entities/user.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { EmailService } from 'src/common/email/email.service';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { EncryptionService } from 'src/common/encryption/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserRole, ProfileUser]),
    JwtModule.register({
      secret: Buffer.from('eW91ci0yNTYtYml0LXNlY3JldA==', 'base64').toString('ascii'), //TOOD: Change this secret key
      signOptions: { expiresIn: '6d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, EmailService, EncryptionService],
  controllers: [AuthController],
})
export class AuthModule {}
