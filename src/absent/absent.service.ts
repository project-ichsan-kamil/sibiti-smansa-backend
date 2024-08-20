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
import { log } from 'console';

@Injectable()
export class AbsentService {
  private readonly logger = new Logger(AbsentService.name);
  constructor(
    @InjectRepository(Absent)
    private readonly absentRepository: Repository<Absent>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(
    createAbsentDto: CreateAbsentDto,
    currentUser: any,
  ): Promise<Absent> {
    const executor = `[${currentUser.fullName}][createAbsent]`;
    const start = Date.now();

    // Mendapatkan waktu saat ini dalam zona waktu Indonesia
    const indonesiaTime = moment().tz('Asia/Jakarta');
    const todayStart = indonesiaTime.clone().startOf('day').toDate();
    const todayEnd = indonesiaTime.clone().endOf('day').toDate();

    // Cek jika user ada
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });
    if (!user) throw new NotFoundException('User not found');

    // Cek jika absensi sudah ada untuk hari ini
    const existingAbsent = await this.absentRepository.findOne({
      where: {
        user: { id: currentUser.id },
        date: Between(todayStart, todayEnd),
      },
    });
    if (existingAbsent)
      throw new BadRequestException(
        'You have already submitted your attendance for today.',
      );

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

    this.logger.log(
      `${executor} Absence created successfully. Execution time: ${Date.now() - start} ms`,
    );
    return savedAbsent;
  }

  async getAbsents(filterDto: any, currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}][getAbsents]`;

    const { name, classId, year, month, day, status } = filterDto;
    const query = this.absentRepository
      .createQueryBuilder('absent')
      .leftJoin('absent.user', 'user')
      .leftJoin('user.profile', 'profile')
      .leftJoin('user.userClasses', 'userClass')
      .leftJoin('userClass.classEntity', 'classEntity')
      .select([
        'absent.id',
        'absent.date',
        'absent.latitude',
        'absent.longitude',
        'absent.status',
        'absent.notes',
        'profile.userId',
        'profile.fullName',
        'classEntity.id',
        'classEntity.name',
      ]);

    // Filter by name from Profile
    if (name) {
      query.andWhere('profile.fullName LIKE :name', { name: `%${name}%` });
    }

    // Filter by classId
    if (classId) {
      query.andWhere('classEntity.id = :classId', { classId });
    }

    // Filter by date (year, month, day)
    if (year && month && day) {
      const startDate = new Date(year, month - 1, day);
      const endDate = new Date(year, month - 1, day, 23, 59, 59);
      query.andWhere('absent.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.andWhere('absent.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      query.andWhere('absent.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Filter by status
    if (status) {
      query.andWhere('absent.status = :status', { status });
    }

    // Optional caching if data is often requested
    query.cache(true); // Enable caching if appropriate

    // Execute query and return mapped results
    const absents = await query.getRawMany();

    const finish = Date.now(); // End time log

    if (!absents.length) {
      throw new NotFoundException('No absences found with the given criteria');
    }

    // Map only the required fields
    const result = absents.map((absent) => ({
      id: absent.absent_id,
      date: absent.absent_date,
      latitude: absent.absent_latitude,
      longitude: absent.absent_longitude,
      status: absent.absent_status,
      notes: absent.absent_notes,
      profile: {
        userId: absent.profile_userId,
        fullName: absent.profile_fullName,
      },
      classEntity: {
        id: absent.classEntity_id,
        name: absent.classEntity_name,
      },
    }));

    this.logger.log(`${executor} Successfully mapped ${result.length} absences`);
    return result;
  }
}
