import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from 'src/class/entities/class.entity';

@Injectable()
export class ClassSeeder {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  public async run() {
    const count = await this.classRepository.count();
    if (count === 0) {
      const classes = [];
      let idCounter = 1;

      // Creating 12 classes for each grade: 10, 11, 12
      const grades = [10, 11, 12];
      const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

      grades.forEach(grade => {
        sections.forEach(section => {
          classes.push({
            id: idCounter,
            nama: `${grade}${section}`,
            kelas: grade,
            status: 1, // Assuming status 1 means active
            statusData: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'SYSTEM',
            updatedBy: 'SYSTEM',
          });
          idCounter++;
        });
      });

      await this.classRepository.save(classes);
      console.log('Classes table has been seeded');
    } else {
      console.log('Classes table is not empty, seeder skipped');
    }
  }
}
