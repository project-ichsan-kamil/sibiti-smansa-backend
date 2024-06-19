import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
    ) {}

    async findAll(): Promise<Class[]> {
        return this.classRepository.find({ where: { statusData: true } });
    }

    async findOne(id: number): Promise<Class> {
        const classEntity = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!classEntity) {
            throw new NotFoundException(`Kelas tidak ditemukan`);
        }
        return classEntity;
    }

    async create(createClassDto: CreateClassDto): Promise<Class> {
        // Convert nama to uppercase
        const upperCaseNama = createClassDto.nama.trim().replace(/\s+/g, ' ').toUpperCase();

        // Check if a class with the same nama exists and statusData is true
        const existingClass = await this.classRepository.findOne({ where: { nama: upperCaseNama, statusData: true } });

        if (existingClass) {
            throw new ConflictException(`Kelas dengan nama ${upperCaseNama} sudah terdaftar.`);
        }

        // Create and save the new class
        const newClass = this.classRepository.create({
            ...createClassDto,
            nama: upperCaseNama,
            statusData: true, // Ensure statusData is set to true when creating
        });

        return this.classRepository.save(newClass);
    }

    async update(id: number, updateClassDto: UpdateClassDto): Promise<Class> {
        // Check if the class exists with statusData true
        const existingClass = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!existingClass) {
            throw new NotFoundException(`Kelas tidak ditemukan`);
        }

        // Convert nama to uppercase if it's being updated
        if (updateClassDto.nama) {
            updateClassDto.nama = updateClassDto.nama.trim().replace(/\s+/g, ' ').toUpperCase();
        }

        // Update the class with new data
        await this.classRepository.update(id, updateClassDto);

        // Fetch and return the updated class
        const updatedClass = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!updatedClass) {
            throw new NotFoundException(`Kelas tidak ditemukan setelah pembaruan`);
        }
        return updatedClass;
    }

    async remove(id: number): Promise<void> {
        // Cek apakah kelas dengan statusData true ada
        const existingClass = await this.classRepository.findOne({ where: { id, statusData: true } });
        if (!existingClass) {
            throw new NotFoundException(`Kelas tidak ditemukan`);
        }

        // Update statusData menjadi false daripada menghapusnya
        await this.classRepository.update(id, { statusData: false });
    }
}
