import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const { title } = createExamDto;
    const existingExam = await this.examRepository.findOne({ where: { title } });
    if (existingExam) {
      throw new HttpException(`Ujian dengan nama ${title} sudah ada`, HttpStatus.BAD_REQUEST);
    }
    const exam = this.examRepository.create(createExamDto);
    const savedExam = await this.examRepository.save(exam);
    return savedExam;
  }

  findAll(): Promise<Exam[]> {
    return this.examRepository.find();
  }

  findOne(id: number): Promise<Exam> {
    return this.examRepository.findOne({where : {id}});
  }

  async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
    await this.examRepository.update(id, updateExamDto);
    const updatedExam = await this.examRepository.findOne({where : {id}});
    if (!updatedExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return updatedExam;
  }

  async remove(id: number): Promise<void> {
    const result = await this.examRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
  }
}
