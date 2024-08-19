import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absent } from './entities/absent.entity';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { StatusAbsent } from './enum/absent.enum';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class AbsentService {
  private readonly logger = new Logger(AbsentService.name);
  constructor(
    @InjectRepository(Absent)
    private readonly absentRepository: Repository<Absent>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(createAbsentDto: CreateAbsentDto, currentUser: any): Promise<Absent> {
    const executor = `[${currentUser.fullName}][createAbsent]`;
    const start = Date.now();
      
    // Jalankan pencarian user dan existingAbsent secara paralel
    const [user, existingAbsent] = await Promise.all([
      this.userRepository.findOne({ where: { id: currentUser.id } }),
      this.absentRepository.findOne({
        where: {
          user: { id: currentUser.id },
          date: createAbsentDto.date,
        },
      }),
    ]);
  
    if (!user) throw new NotFoundException('User not found');
    if (existingAbsent) throw new BadRequestException('You have already submitted your attendance for today.');
  
    const savedAbsent = await this.absentRepository.save(
      this.absentRepository.create({
        ...createAbsentDto,
        user,
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
      }),
    );
  
    this.logger.log(`${executor} Absence created successfully. Execution time: ${Date.now() - start} ms`);
    return savedAbsent;
  }
  
  
}
