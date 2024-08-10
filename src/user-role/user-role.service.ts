import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  
    // Check if the currentUser is a Guru but not an Admin
    if (await this.isGuru(currentUser.id) && !(await this.isAdmin(currentUser.id))) {
      this.logger.error(`${executor} Guru are not allowed to create roles`);
      throw new HttpException(
        'Guru tidak diperbolehkan untuk membuat role',
        HttpStatus.FORBIDDEN,
      );
    }
  
    // Check if a Super Admin already exists
    if (role === UserRoleEnum.SUPER_ADMIN && (await this.isSuperAdminExists())) {
      this.logger.error(`${executor} A Super Admin already exists`);
      throw new HttpException(
        'Sudah ada akun dengan role Super Admin yang terdaftar',
        HttpStatus.FORBIDDEN,
      );
    }
  
    // Allow Admin to create Guru roles, and Super Admin to create Admin or Guru roles
    if (
      role === UserRoleEnum.ADMIN && !(await this.isSuperAdmin(currentUser.id))
    ) {
      this.logger.error(`${executor} Only Super Admin can create Admin roles`);
      throw new HttpException(
        'Hanya Super Admin yang dapat membuat role Admin',
        HttpStatus.FORBIDDEN,
      );
    }
  
    if (
      role === UserRoleEnum.GURU && !(await this.isSuperAdmin(currentUser.id)) && !(await this.isAdmin(currentUser.id))
    ) {
      this.logger.error(`${executor} Only Super Admin or Admin can create Guru roles`);
      throw new HttpException(
        'Hanya Super Admin atau Admin yang dapat membuat role Guru',
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
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
      subject = await this.subjectRepository.findOne({ where: { id: subjectId } });
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
  
  // Helper function to check if the user is a Guru
  private async isGuru(userId: number): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role: UserRoleEnum.GURU,
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
  private async isRoleExistsForUser(userId: number, role: UserRoleEnum): Promise<boolean> {
    return !!(await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role,
        statusData: true,
      },
    }));
  }

}
