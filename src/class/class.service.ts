import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';

@Injectable()
export class ClassService {
    private readonly logger = new Logger(ClassService.name);

    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
    ) {}

    async findAll(currentUser: any, name?: string): Promise<Class[]> {
        const executor = `[${currentUser.fullName}] [findAll]`;
        this.logger.log(`${executor} Fetching all classes with statusData true`);
    
        const query = this.classRepository.createQueryBuilder('class')
          .where('class.statusData = :statusData', { statusData: true })
          .orderBy('class.name', 'ASC');
    
        if (name) {
            query.andWhere('class.name LIKE :name', { name: `%${name}%` });
        }
    
        return await query.getMany();
    } 

    async findOne(id: number, currentUser: any): Promise<Class> {
        const executor = `[${currentUser.fullName}] [findOne]`;
        this.logger.log(`${executor} Fetching class with id ${id}`);
        const classEntity = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!classEntity) {
            this.logger.warn(`${executor} Class with id ${id} not found`);
            throw new NotFoundException(`Class not found`);
        }
        return classEntity;
    }
}
