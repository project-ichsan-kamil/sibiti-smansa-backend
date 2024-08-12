import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { ProfileUserModule } from './profile-user/profile-user.module';
import { DataSource } from 'typeorm';
import { ClassModule } from './class/class.module';
import { ExamModule } from './exam/exam.module';
import { AuthModule } from './auth/auth.module';
import { UserRoleModule } from './user-role/user-role.module';
import { EncryptionService } from './common/encryption/encryption.service';
import { SubjectModule } from './subject/subject.module';
import { SeederModule } from './seeder/seeder.module';
import { ExcelModule } from './excel/excel.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guard/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'sibiti',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    ProfileUserModule,
    ClassModule,
    ExamModule,
    AuthModule,
    UserRoleModule,
    SubjectModule,
    SeederModule,
    ExcelModule,
  ],
  controllers: [],
  providers: [
    EncryptionService,
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}

