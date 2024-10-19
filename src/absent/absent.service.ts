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
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Injectable()
export class AbsentService {
  private cache = new Map();
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

      // Cache key based on user ID
      const cacheKey = `absent_${currentUser.id}`;

      // Check if the data is cached and valid (not expired)
      const cachedData = this.cache.get(cacheKey);
      
      if (cachedData && cachedData.expiration > Date.now()) {
        return cachedData.data;
      }

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

      // Cache the result with an expiration time of 10 seconds
      const expiration = Date.now() + (12 * 60 * 60 * 1000);
      this.cache.set(cacheKey, { data: result, expiration });        

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
  

async getAbsentsByDateForTeachers(currentUser: any, startDate: Date, endDate: Date): Promise<any[]> {
  const executor = `[${currentUser.fullName}] [getAbsentsByDateForTeachers]`;

  const query = `
    SELECT
      a.id AS "absentId",
      a.date AS "date",
      a.latitude AS "latitude",
      a.longitude AS "longitude",
      a.status AS "status",
      a.notes AS "notes",
      a.urlFile AS "urlFile",
      p.fullName AS "fullName",
      s.id AS "subjectId",
      s.name AS "subjectName"
    FROM
      absent a
    LEFT JOIN user_role ur ON ur.userId = a.userId
    LEFT JOIN profile_user p ON p.userId = a.userId
    LEFT JOIN subject s ON ur.subjectId = s.id
    WHERE
      ur.role = ?
      AND ur.statusData = true
      AND a.date BETWEEN ? AND ?
      AND a.statusData = true
    ORDER BY
      a.createdAt DESC
  `;

  // Menjalankan query SQL dengan parameter
  const absences = await this.absentRepository.query(query, [UserRoleEnum.GURU, startDate, endDate]);

  if (!absences.length) {
    this.logger.warn(`${executor} No absences found for users with role "guru" in the specified date range.`);
  }

  // Mapping hasil query untuk menampilkan hasil yang lebih rapi
  const result = absences.map((absent) => ({
    id: absent.absentId,
    date: absent.date,
    status: absent.status,
    longitude: absent.longitude,
    latitude: absent.latitude,
    notes: absent.notes,
    urlFile: absent.urlFile,
    fullName: absent.fullName,
    subject: absent.subjectName,
  }));

  this.logger.log(`${executor} Successfully fetched ${result.length} absences`);
  return result;
}


async getFilteredAbsentsForStudents(
  currentUser: any,
  classId: number | null,  // Allow classId to be null
  date: Date,
): Promise<any[]> {
  const executor = `[${currentUser.fullName}] [getFilteredAbsentsForStudents]`;
  const formattedDate = date.toISOString().slice(0, 10);
  this.logger.log(`${executor} Filtering absents for date: ${formattedDate}, classId: ${classId}`);

  
  // Start building the query
  const query = this.absentRepository.createQueryBuilder('absent')
      .innerJoin('absent.user', 'u') // Join to user
      .innerJoin('u.userClasses', 'uc') // Join to userClasses
      .innerJoin('uc.classEntity', 'c') // Join to classEntity in UserClass
      .innerJoin('u.profile', 'p') // Join to profile to get fullName
      .where('DATE(absent.date) = :date', { date: formattedDate }); // Always filter by date

  // Conditionally add classId filter if provided
  if (classId) {
      query.andWhere('uc.classEntityId = :classId', { classId }); // Filter by classId if provided
  }

  // Select specific columns, including fullName and class name
  query.select([
      'absent.id AS absentId',
      'absent.date AS date',
      'absent.latitude AS latitude',
      'absent.longitude AS longitude',
      'absent.status AS status',
      'absent.notes AS notes',
      'absent.urlFile AS urlFile',
      'p.fullName AS fullName', // Full name from profile
      'c.name AS className' // Class name
  ]);

  query.orderBy('absent.createdAt', 'DESC');

  const absences = await query.getRawMany();

  if (absences.length === 0) {
    this.logger.warn(`${executor} No absences found for the provided filters.`);
  } else {
    this.logger.log(`${executor} Successfully fetched ${absences.length} absences.`);
  }
  return absences;
}





}
