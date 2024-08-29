import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Class } from './entities/class.entity';

@Injectable()
export class ClassService {
    private readonly logger = new Logger(ClassService.name);

    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
    ) {}

    async findAll(currentUser: any): Promise<Class[]> {
        const executor = `[${currentUser.fullName}][findAll]`;
        this.logger.log(`${executor} Fetching all classes with statusData true`);
        return this.classRepository.find({ where: { statusData: true }, order: { name: 'ASC' } });
    }

    async findOne(id: number, currentUser: any): Promise<Class> {
        const executor = `[${currentUser.fullName}][findOne]`;
        this.logger.log(`${executor} Fetching class with id ${id}`);
        const classEntity = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!classEntity) {
            this.logger.warn(`${executor} Class with id ${id} not found`);
            throw new NotFoundException(`Class not found`);
        }
        return classEntity;
    }

    async searchByName(nama: string, currentUser: any): Promise<Class[]> {
        const executor = `[${currentUser.fullName}][searchByName]`;
        this.logger.log(`${executor} Searching classes with name containing ${nama}`);
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
