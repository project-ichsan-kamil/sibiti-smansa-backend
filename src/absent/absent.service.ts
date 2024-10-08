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
import { StatusAbsent } from './enum/absent.enum';

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
    urlFile: any
): Promise<Absent> {
    const executor = `[${currentUser.fullName}][createAbsent]`;

    // Get current time in Indonesia timezone
    const indonesiaTime = moment().tz('Asia/Jakarta');
    const todayStart = indonesiaTime.clone().startOf('day').toDate();
    const todayEnd = indonesiaTime.clone().endOf('day').toDate();

    // Combine user and existing absence checks
    const [user, existingAbsent] = await Promise.all([
        this.userRepository.findOne({ where: { id: currentUser.id } }),
        this.absentRepository.findOne({
            where: {
                user: { id: currentUser.id },
                date: Between(todayStart, todayEnd),
            },
        }),
    ]);

    if (!user) {
        throw new NotFoundException(`User with ID ${currentUser.id} not found`);
    }

    if (existingAbsent) {
        throw new BadRequestException('You have already submitted your attendance for today.');
    }

     // Define late threshold (e.g., 08:30 AM)
     const lateThreshold = moment().tz('Asia/Jakarta').set({ hour: 7, minute: 30, second: 0, millisecond: 0 });

     // Determine the status
     let status = createAbsentDto.status;
     if (status === StatusAbsent.PRESENT && indonesiaTime.isAfter(lateThreshold)) {
         status = StatusAbsent.LATE; 
     }

    // Save new absence
    const savedAbsent = await this.absentRepository.save(
        this.absentRepository.create({
            ...createAbsentDto,
            status, 
            urlFile,
            user,
            date: indonesiaTime.toDate(),
            createdBy: currentUser.fullName,
            updatedBy: currentUser.fullName,
        }),
    );

    this.logger.log(
        `${executor} Absence created successfully for User ID ${currentUser.id}`,
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

  
  async checkToday(currentUser: any): Promise<any> {
    const executor = `[${currentUser.fullName}][checkToday]`;
    this.logger.log(`${executor} Checking today's absence.`); 

    const indonesiaTime = moment().tz('Asia/Jakarta');
    const todayStart = indonesiaTime.clone().startOf('day').toDate();
    const todayEnd = indonesiaTime.clone().endOf('day').toDate();

    const existingAbsent = await this.absentRepository.findOne({
      where: {
        user: { id: currentUser.id },
        date: Between(todayStart, todayEnd),
        statusData: true
      },
    });

    if (!existingAbsent) {
      return null;
  }

    const result = {
      id: existingAbsent.id,
      date: new Date(existingAbsent.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: new Date(existingAbsent.date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: existingAbsent.status,
    };
        

    return result;
  }

  async getAbsentsUserByMonthAndYear(currentUser: any, month: number, year: number): Promise<any[]> {
    const executor = `[${currentUser.fullName}] [getAbsentsByMonthAndYear]`;
    this.logger.log(`${executor} Fetching absences for User ID: ${currentUser.id} for month: ${month}, year: ${year}`);

    // Set start and end date for the given month and year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Menggunakan QueryBuilder untuk membuat query SQL secara manual
    const query = `
    SELECT date, status, longitude, latitude, notes, urlFile AS "urlFile"
    FROM absent
    WHERE userId = ? 
    AND date BETWEEN ? AND ?
    AND statusData = true
  `;

    // Eksekusi query SQL
    const absences = await this.absentRepository.query(query, [currentUser.id, startDate, endDate]);

    if (!absences.length) {
      this.logger.warn(`${executor} No absences found for the specified criteria.`);
      return [];
    }

    // Mapping the result to include only the necessary fields
    const result = absences.map((absent) => ({
      date: absent.date,
      status: absent.status,
      longitude: absent.longitude,
      latitude: absent.latitude,
      notes: absent.notes,
      urlFile: absent.urlFile,
    }));

    this.logger.log(`${executor} Successfully fetched ${result.length} absences,`);
    return result;
}

  
}
