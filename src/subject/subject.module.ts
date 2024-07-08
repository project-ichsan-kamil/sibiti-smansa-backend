import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectSeeder } from 'src/seeder/SubjectSeeder';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  providers: [SubjectService, SubjectSeeder],
  exports: [SubjectService],
})
export class SubjectModule {}
