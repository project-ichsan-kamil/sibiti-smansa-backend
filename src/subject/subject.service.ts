import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async findAll(currentUser: any): Promise<Partial<Subject>[]> {
    const executor = `[${currentUser.fullName}][findAll]`;
    this.logger.log(`${executor} Fetching all active subjects`);

    const subjects = await this.subjectRepository.find({ where: { statusData: true } });

    this.logger.log(`${executor} Found ${subjects.length} active subjects`);
    return subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      statusData: subject.statusData,
    }));
  }
}
