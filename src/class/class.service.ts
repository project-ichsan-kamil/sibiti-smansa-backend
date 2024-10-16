import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { UserClass } from './entities/user-class.entity';

@Injectable()
export class ClassService {
    private readonly logger = new Logger(ClassService.name);

    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
        @InjectRepository(UserClass)
        private readonly userClassRepository: Repository<UserClass>,
    ) {}

    async findAllClass(currentUser: any, name?: string): Promise<Class[]> {
        const executor = `[${currentUser.fullName}] [findAllClass]`;
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

    async findAllStudents(classId?: number, name?: string): Promise<any[]> {
        const query = this.userClassRepository.createQueryBuilder('userClass')
          .leftJoinAndSelect('userClass.user', 'user')
          .leftJoinAndSelect('user.profile', 'profile')
          .leftJoinAndSelect('userClass.classEntity', 'class') // Menyesuaikan dengan nama properti classEntity
          .where('userClass.statusData = :statusData', { statusData: true })
          .andWhere('user.statusData = :statusData', { statusData: true })
          .andWhere('user.isVerified = :isVerified', { isVerified: true });
    
        if (classId) {
          query.andWhere('userClass.classEntityId = :classId', { classId });
        }
    
        if (name) {
          query.andWhere('profile.fullName LIKE :name', { name: `%${name}%` });
        }
    
        const students = await query.getMany();
    
        this.logger.log(`Found ${students.length} students matching the criteria`);
    
        return students.map(student => ({
          userId: student.user.id,
          fullName: student.user.profile.fullName,
          email: student.user.email,
          classId: student.classEntity.id,
          className: student.classEntity.name,
        }));
      }
}
