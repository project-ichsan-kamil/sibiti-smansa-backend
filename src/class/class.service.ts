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
        return this.classRepository.find({ where: { statusData: true }, order: { updatedAt : 'DESC' } });
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

    // async create(createClassDto: CreateClassDto): Promise<Class> {
    //     this.logger.log('[create] Creating a new class');
    //     const upperCaseNama = createClassDto.nama.trim().replace(/\s+/g, ' ').toUpperCase();

    //     const existingClass = await this.classRepository.findOne({ where: { nama: upperCaseNama, statusData: true } });

    //     if (existingClass) {
    //         this.logger.warn(`[create] Class with name ${upperCaseNama} already exists`);
    //         throw new ConflictException(`Kelas dengan nama ${upperCaseNama} sudah terdaftar.`);
    //     }

    //     const newClass = this.classRepository.create({
    //         ...createClassDto,
    //         nama: upperCaseNama,
    //         statusData: true,
    //     });

    //     this.logger.log(`[create] Class with name ${upperCaseNama} created successfully`);
    //     return this.classRepository.save(newClass);
    // }

    // async update(id: number, updateClassDto: UpdateClassDto): Promise<any> {
    //     this.logger.log(`[update] Updating class with id ${id}`);
    //     const existingClass = await this.classRepository.findOne({ where: { id, statusData: true } });
    //     if (!existingClass) {
    //         this.logger.warn(`[update] Class with id ${id} not found`);
    //         throw new NotFoundException(`Kelas tidak ditemukan`);
    //     }

    //     if (updateClassDto.nama) {
    //         updateClassDto.nama = updateClassDto.nama.trim().replace(/\s+/g, ' ').toUpperCase();
    //     }

    //     this.logger.log(`[update] Class with id ${id} updated successfully`);
    //     return await this.classRepository.update(id, updateClassDto);
    // }

    // async remove(id: number): Promise<void> {
    //     this.logger.log(`[remove] Removing class with id ${id}`);
    //     const existingClass = await this.classRepository.findOne({ where: { id, statusData: true } });
    //     if (!existingClass) {
    //         this.logger.warn(`[remove] Class with id ${id} not found`);
    //         throw new NotFoundException(`Kelas tidak ditemukan`);
    //     }

    //     await this.classRepository.update(id, { statusData: false });
    //     this.logger.log(`[remove] Class with id ${id} marked as inactive`);
    // }

    async searchByName(nama: string): Promise<Class[]> {
        this.logger.log(`[searchByName] Searching classes with name containing ${nama}`);
        const lowerCaseNama = nama.trim().replace(/\s+/g, ' ').toLowerCase();
        return this.classRepository.find({ 
            where: { 
                nama: Like(`%${lowerCaseNama}%`), 
                statusData: true 
            }, 
            order: { updatedAt: 'DESC' } 
        });
    }
}