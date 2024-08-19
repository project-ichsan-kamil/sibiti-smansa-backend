import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absent } from './entities/absent.entity';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { UpdateAbsentDto } from './dto/update-absent.dto';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class AbsentService {
  constructor(
    @InjectRepository(Absent)
    private readonly absentRepository: Repository<Absent>,
  ) {}

  async create(createAbsentDto: CreateAbsentDto, createdBy: string): Promise<Absent> {
    const absent = this.absentRepository.create({
      ...createAbsentDto,
      createdBy: createdBy,
    });
    return this.absentRepository.save(absent);
  }

  async findAll(): Promise<Absent[]> {
    return this.absentRepository.find({ where: { statusData: true }, relations: ['user'] });
  }

  async findOne(id: number): Promise<Absent> {
    const absent = await this.absentRepository.findOne({ where: { id, statusData: true }, relations: ['user'] });
    if (!absent) {
      throw new NotFoundException(`Absent record with ID ${id} not found`);
    }
    return absent;
  }

  async update(id: number, updateAbsentDto: UpdateAbsentDto, updatedBy: string): Promise<Absent> {
    const absent = await this.findOne(id);
    Object.assign(absent, updateAbsentDto, { updatedBy });
    return this.absentRepository.save(absent);
  }

  async remove(id: number): Promise<void> {
    const absent = await this.findOne(id);
    absent.statusData = false;
    await this.absentRepository.save(absent);
  }
}
