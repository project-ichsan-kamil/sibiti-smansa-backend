import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SebExam } from './entities/seb-exam.entity';
import { SebExamService } from './seb-exam.service';
import { SebExamController } from './seb-exam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SebExam])],
  providers: [SebExamService],
  controllers: [SebExamController],
})
export class SebExamModule {}
