import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from 'src/class/entities/class.entity';
import { ClassSeeder } from './ClassSeeder';
import { SubjectSeeder } from './SubjectSeeder';
import { Subject } from 'src/subject/entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Subject])],
  providers: [ClassSeeder, SubjectSeeder],
  exports: [ClassSeeder, SubjectSeeder],
})
export class SeederModule {}
