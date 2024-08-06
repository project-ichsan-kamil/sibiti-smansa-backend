import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const { name, description } = createSubjectDto;
    const subject = this.subjectRepository.create({ name, description });
    return await this.subjectRepository.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return await this.subjectRepository.find({ where: { statusData: true } });
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async findByName(name: string): Promise<Subject[]> {
    return await this.subjectRepository.find({ where: { name } });
  }

  async update(
    id: number,
    name: string,
    description: string,
    updatedBy: string,
  ): Promise<Subject> {
    const subject = await this.findOne(id);
    subject.name = name;
    subject.description = description;
    subject.updatedBy = updatedBy;
    return await this.subjectRepository.save(subject);
  }

  async remove(id: number): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectRepository.remove(subject);
  }
}
