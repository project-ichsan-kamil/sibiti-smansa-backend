import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
    private readonly logger = new Logger(ClassService.name);

    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
    ) {}

    async findAll(): Promise<Class[]> {
        this.logger.log('[findAll] Fetching all classes with statusData true');
        return this.classRepository.find({ where: { statusData: true }, order: { name : 'ASC' } });
    }

    async findOne(id: number): Promise<Class> {
        this.logger.log(`[findOne] Fetching class with id ${id}`);
        const classEntity = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!classEntity) {
            this.logger.warn(`[findOne] Class with id ${id} not found`);
            throw new NotFoundException(`Kelas tidak ditemukan`);
        }
        return classEntity;
    }

    async searchByName(nama: string): Promise<Class[]> {
        this.logger.log(`[searchByName] Searching classes with name containing ${nama}`);
        const lowerCaseNama = nama.trim().replace(/\s+/g, ' ').toLowerCase();
        return this.classRepository.find({ 
            where: { 
                name: Like(`%${lowerCaseNama}%`), 
                statusData: true 
            }, 
            order: { updatedAt: 'DESC' } 
        });
    }
}