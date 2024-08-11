import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { Users } from 'src/users/entities/user.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { UserRoleEnum } from './enum/user-role.enum';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async createRole(
    role: UserRoleEnum,
    userId: number,
    subjectId: number | null,
    currentUser: any,
  ): Promise<UserRole> {
    const executor = `[${currentUser.fullName}][createRole]`;
    this.logger.log(`${executor} Starting role creation`);

    // Cek apakah sudah ada Super Admin yang terdaftar
    if (
      role === UserRoleEnum.SUPER_ADMIN &&
      (await this.isSuperAdminExists())
    ) {
      this.logger.error(`${executor} A Super Admin already exists`);
      throw new HttpException(
        'Sudah ada akun dengan role Super Admin yang terdaftar',
        HttpStatus.FORBIDDEN,
      );
    }

    // Cek jika peran yang akan dibuat adalah Admin, pastikan hanya Super Admin yang bisa melakukannya
    if (
      role === UserRoleEnum.ADMIN &&
      !(await this.isSuperAdmin(currentUser.id))
    ) {
      this.logger.error(`${executor} Only Super Admin can create Admin roles`);
      throw new HttpException(
        'Hanya Super Admin yang dapat membuat role Admin',
        HttpStatus.FORBIDDEN,
      );
    }

    // Validate Subject ID if the role is Guru
    if (role === UserRoleEnum.GURU && !subjectId) {
      this.logger.error(`${executor} Subject ID is required for Guru role`);
      throw new HttpException(
        'Mata Pelajaran diperlukan saat membuat role GURU',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if the user already has the specified role
    if (await this.isRoleExistsForUser(userId, role)) {
      this.logger.error(`${executor} User already has this role`);
      throw new HttpException(
        'User sudah terdaftar dengan role yang sama',
        HttpStatus.CONFLICT,
      );
    }

    // Verify if the user exists
    const user = await this.userRepository.findOne({
      where: { id: userId, statusData: true },
    });
    if (!user) {
      this.logger.error(`${executor} User not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Check if the user is verified
    if (!user.isVerified) {
      this.logger.error(`${executor} User is not verified`);
      throw new HttpException('User belum diverifikasi', HttpStatus.FORBIDDEN);
    }

    // Verify if the subject exists if the role is Guru
    let subject: Subject = null;
    if (role === UserRoleEnum.GURU) {
      subject = await this.subjectRepository.findOne({
        where: { id: subjectId, statusData: true },
      });
      if (!subject) {
        this.logger.error(`${executor} Subject not found`);
        throw new HttpException(
          'Mata Pelajaran tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Create and save the new role
    const userRole = this.userRoleRepository.create({
      user,
      role,
      subject,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
    });

    const savedRole = await this.userRoleRepository.save(userRole);
    this.logger.log(`${executor} Role created successfully`);
    return savedRole;
  }

  async getListAdmin(currentUser: any): Promise<UserRole[]> {
    const executor = `[${currentUser.fullName}][getListAdmin]`;
    this.logger.log(`${executor} Fetching list of Admins`); 
  
    // Cari semua pengguna dengan peran Admin
    const admins = await this.userRoleRepository.find({
      where: {
        role: UserRoleEnum.ADMIN,
        statusData: true,
        user: {
          statusData: true, // Pengguna harus aktif
          isVerified: true, // Pengguna harus diverifikasi
        },
      },
      relations: ['user'], // Termasuk informasi pengguna terkait
    });
  
    if (!admins.length) {
      this.logger.warn(`${executor} No Admins found`);
      throw new HttpException('Tidak ada user role Admin yang ditemukan', HttpStatus.NOT_FOUND);
    }
  
    this.logger.log(`${executor} ${admins.length} Admins found`);
    return admins;
  }

  async getListGuru(currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}][getListGuru]`;
    this.logger.log(`${executor} Fetching list of Gurus`);

    // Mencari semua pengguna dengan peran Guru yang aktif dan terverifikasi
    const gurus = await this.userRoleRepository.find({
      where: {
        role: UserRoleEnum.GURU,
        statusData: true, // Hanya yang aktif
        user: {
          statusData: true, // Pengguna harus aktif
          isVerified: true, // Pengguna harus diverifikasi
        },
      },
      relations: ['user'], // Termasuk informasi pengguna terkait
    });

    if (!gurus.length) {
      this.logger.warn(`${executor} No Gurus found`);
    }

    this.logger.log(`${executor} ${gurus.length} Gurus found`);
    return gurus;
  }

  async getListUserByFullNameAndRole(fullName: string, role: UserRoleEnum, currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}][getListUserByFullNameAndRole]`;
    this.logger.log(`${executor} Fetching list of users with role: ${role} by full name: ${fullName}`);

    // Cari pengguna dengan nama (LIKE) di ProfileUser, peran yang diberikan, statusData true, dan isVerified true
    const users = await this.userRoleRepository.find({
      where: {
        role: role,
        statusData: true, // Hanya pengguna yang aktif
        user: {
          statusData: true, // Pengguna harus aktif
          isVerified: true, // Pengguna harus diverifikasi
          profile: {
            fullName: Like(`%${fullName}%`), // Mencari berdasarkan LIKE untuk nama
          },
        },
      },
      relations: ['user', 'user.profile'], // Mengambil relasi dengan User dan ProfileUser
    });

    if (!users.length) {
      this.logger.warn(`${executor} No users found matching the role: ${role} and name: ${fullName}`);
    }

    this.logger.log(`${executor} ${users.length} users found with role: ${role}`);
    return users;
  }
  

  async updateRoleGuru(
    roleId: number,
    subjectId: number,
    currentUser: any,
  ): Promise<UserRole> {
    const executor = `[${currentUser.fullName}][updateRoleGuru]`;
    this.logger.log(`${executor} Starting update for Guru role subject`);

    // Check if the currentUser is either Super Admin or Admin
    const isSuperAdmin = await this.isSuperAdmin(currentUser.id);
    const isAdmin = await this.isAdmin(currentUser.id);

    if (!isSuperAdmin && !isAdmin) {
      this.logger.error(
        `${executor} Only Super Admin or Admin can update Guru role`,
      );
      throw new HttpException(
        'Hanya Super Admin atau Admin yang dapat memperbarui subject role Guru',
        HttpStatus.FORBIDDEN,
      );
    }

    // Find the role by ID
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId, role: UserRoleEnum.GURU },
      relations: ['user', 'subject'],
    });

    if (!role) {
      this.logger.error(`${executor} Guru role not found`);
      throw new HttpException(
        'Role Guru tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if the subject exists
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      this.logger.error(`${executor} Subject not found`);
      throw new HttpException(
        'Mata Pelajaran tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the subject of the Guru role
    role.subject = subject;
    role.updatedBy = currentUser.fullName;

    const updatedRole = await this.userRoleRepository.save(role);
    this.logger.log(`${executor} Role subject updated successfully`);
    return updatedRole;
  }

  // Helper function to check if the user is an Admin
  private async isAdmin(userId: number): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role: UserRoleEnum.ADMIN,
        statusData: true,
      },
    }));
  }

  // Helper function to check if a Super Admin already exists
  private async isSuperAdminExists(): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        role: UserRoleEnum.SUPER_ADMIN,
        statusData: true,
      },
    }));
  }

  // Helper function to check if the currentUser is a Super Admin
  async isSuperAdmin(userId: number): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role: UserRoleEnum.SUPER_ADMIN,
        statusData: true,
      },
    }));
  }

  // Helper function to check if the user already has the specified role
  private async isRoleExistsForUser(
    userId: number,
    role: UserRoleEnum,
  ): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role,
        statusData: true,
      },
    }));
  }
}
