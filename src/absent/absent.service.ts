import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Absent } from './entities/absent.entity';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { Users } from 'src/users/entities/user.entity';
import * as moment from 'moment-timezone';

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
  
    // Mendapatkan waktu saat ini dalam zona waktu Indonesia
    const indonesiaTime = moment().tz('Asia/Jakarta');
    const todayStart = indonesiaTime.clone().startOf('day').toDate();
    const todayEnd = indonesiaTime.clone().endOf('day').toDate();
  
    // Cek jika user ada
    const user = await this.userRepository.findOne({ where: { id: currentUser.id } });
    if (!user) throw new NotFoundException('User not found');
  
    // Cek jika absensi sudah ada untuk hari ini
    const existingAbsent = await this.absentRepository.findOne({
      where: {
        user: { id: currentUser.id },
        date: Between(todayStart, todayEnd),
      },
    });
    if (existingAbsent) throw new BadRequestException('You have already submitted your attendance for today.');
  
    // Simpan absensi baru
    const savedAbsent = await this.absentRepository.save(
      this.absentRepository.create({
        ...createAbsentDto,
        user,
        date: indonesiaTime.toDate(),
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
      }),
    );
  
    this.logger.log(`${executor} Absence created successfully. Execution time: ${Date.now() - start} ms`);
    return savedAbsent;
  }
  
}
