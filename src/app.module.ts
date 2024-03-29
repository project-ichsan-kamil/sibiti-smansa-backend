import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ProfileUserModule } from './profile-user/profile-user.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
  //   TypeOrmModule.forRoot({
  //   type: 'mysql',
  //   host: 'localhost',
  //   port: 3306,
  //   username: 'root',
  //   password: 'root',
  //   database: 'test',
  //   entities: [User, ProfileUser],
  //   synchronize: true,
  // }),
  JwtModule.register({
    global : true,
    secret:  process.env.JWT_SECRET,
    secretOrPrivateKey : process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  }),
  UsersModule, ProfileUserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  // constructor(private dataSource: DataSource) {}
}
