import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { ProfileUserModule } from './profile-user/profile-user.module';
import { ProfileUser } from './profile-user/entities/profile-user.entity';


@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [User, ProfileUser],
    synchronize: true,
  }), UsersModule, ProfileUserModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  // constructor(private dataSource: DataSource) {}
}
