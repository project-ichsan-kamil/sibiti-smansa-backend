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

  async findAll(currentUser: any, name?: string): Promise<Partial<Subject>[]> {
    const executor = `[${currentUser.fullName}] [findAll]`;

    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .where('subject.statusData = :statusData', { statusData: true });

    if (name) {
      query.andWhere('subject.name LIKE :name', { name: `%${name}%` });
    }

    const subjects = await query.getMany();

    this.logger.log(`${executor} Found ${subjects.length} active subjects`);

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      statusData: subject.statusData,
      createdAt: subject.createdAt,
    }));
  }
}
