import { Module } from '@nestjs/common';
import { AbsentService } from './absent.service';
import { AbsentController } from './absent.controller';
import { Absent } from './entities/absent.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Absent, Users])],
  controllers: [AbsentController],
  providers: [AbsentService],
})
export class AbsentModule {}
