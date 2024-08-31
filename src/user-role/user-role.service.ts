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

  async getListAdmin(currentUser: any, name?: string): Promise<any> {
    const executor = `[${currentUser.fullName}] [getListAdmin]`;
    this.logger.log(`${executor} Fetching list of Admins`);
  
    // Membangun query untuk menemukan semua pengguna dengan role Admin
    const query = this.userRoleRepository.createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('userRole.role = :role', { role: UserRoleEnum.ADMIN })
      .andWhere('userRole.statusData = :statusData', { statusData: true })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .andWhere('user.isVerified = :isVerified', { isVerified: true });

    // Menambahkan filter pencarian berdasarkan nama jika parameter name diberikan
    if (name) {
        query.andWhere('profile.fullName LIKE :name', { name: `%${name}%` });
    }
  
    const admins = await query.getMany();
  
    if (!admins.length) {
      this.logger.warn(`${executor} No Admins found`);
    }
  
    this.logger.log(`${executor} ${admins.length} Admins found`);
    return admins.map(admin => ({
      id: admin.id,
      userId: admin.user.id,
      fullName: admin.user.profile.fullName,
      role: admin.role
    }));
}
  
  async getListGuru(currentUser: any, name?: string): Promise<any[]> {
    const executor = `[${currentUser.fullName}] [getListGuru]`;
    this.logger.log(`${executor} Fetching list of Gurus`);
  
    const query = this.userRoleRepository.createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('userRole.subject', 'subject')
      .where('userRole.role = :role', { role: UserRoleEnum.GURU })
      .andWhere('userRole.statusData = :statusData', { statusData: true })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .andWhere('user.isVerified = :isVerified', { isVerified: true });
  
    // Add name filter if provided
    if (name) {
      query.andWhere('profile.fullName LIKE :name', { name: `%${name}%` });
    }
  
    const gurus = await query.getMany();
  
    if (!gurus.length) {
      this.logger.warn(`${executor} No Gurus found`);
    }
  
    this.logger.log(`${executor} ${gurus.length} Gurus found`);
    return gurus.map(guru => ({
      id: guru.id,
      userId: guru.user.id,
      fullName: guru.user.profile.fullName,
      subject: guru.subject ? guru.subject.name : null,
    }));
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

  async deactivateGuruRole(roleId: number, currentUser: any): Promise<void> {
    const executor = `[${currentUser.fullName}][deactivateGuruRole]`;
    this.logger.log(`${executor} Attempting to deactivate Guru role with ID: ${roleId}`);

    // Fetch the role to be deactivated
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId, role: UserRoleEnum.GURU, statusData: true },
      relations: ['user'],
    });

    if (!role) {
      this.logger.error(`${executor} Active Guru role with ID: ${roleId} not found`);
      throw new HttpException('Role Guru tidak ditemukan atau sudah dinonaktifkan', HttpStatus.NOT_FOUND);
    }

    // Update the statusData to false instead of deleting
    role.statusData = false;
    await this.userRoleRepository.save(role);
    this.logger.log(`${executor} Guru role with ID: ${roleId} deactivated successfully`);
  }

  async deactivateAdminRole(roleId: number, currentUser: any): Promise<void> {
    const executor = `[${currentUser.fullName}][deactivateAdminRole]`;
    this.logger.log(`${executor} Attempting to deactivate Admin role with ID: ${roleId}`);

    // Fetch the role to be deactivated
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId, role: UserRoleEnum.ADMIN, statusData: true },
      relations: ['user'],
    });

    if (!role) {
      this.logger.error(`${executor} Active Admin role with ID: ${roleId} not found`);
      throw new HttpException('Role Admin tidak ditemukan atau sudah dinonaktifkan', HttpStatus.NOT_FOUND);
    }

    // Update the statusData to false instead of deleting
    role.statusData = false;
    await this.userRoleRepository.save(role);
    this.logger.log(`${executor} Admin role with ID: ${roleId} deactivated successfully`);
  }

  async getRoleById(roleId: number, currentUser: any): Promise<UserRole> {
    const executor = `[${currentUser.fullName}] [getRoleById]`;
    this.logger.log(`${executor} Fetching role with ID: ${roleId}`);

    // Fetch the role by ID
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId, statusData: true },
      relations: ['user', 'user.profile'], // Include related user and profile information
    });

    if (!role) {
      this.logger.error(`${executor} Role with ID: ${roleId} not found`);
      throw new HttpException('Role tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    this.logger.log(`${executor} Role with ID: ${roleId} fetched successfully`);
    return role;
  }


  async updateGuruSubject(roleId: number, newSubjectId: number, currentUser: any): Promise<UserRole> {
    const executor = `[${currentUser.fullName}] [updateGuruSubject]`;
    this.logger.log(`${executor} Attempting to update subject for Guru role with ID: ${roleId}`);

    // Fetch the role to be updated
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId, role: UserRoleEnum.GURU, statusData: true },
      relations: ['user', 'subject'],
    });

    if (!role) {
      this.logger.error(`${executor} Guru role with ID: ${roleId} not found`);
      throw new HttpException('Role Guru tidak ditemukan atau sudah dinonaktifkan', HttpStatus.NOT_FOUND);
    }

    // Fetch the new subject
    const newSubject = await this.subjectRepository.findOne({ where: { id: newSubjectId, statusData: true } });

    if (!newSubject) {
      this.logger.error(`${executor} Subject with ID: ${newSubjectId} not found`);
      throw new HttpException('Mata pelajaran tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Update the subject
    role.subject = newSubject;
    role.updatedBy = currentUser.fullName;

    const updatedRole = await this.userRoleRepository.save(role);
    this.logger.log(`${executor} Subject for Guru role with ID: ${roleId} updated successfully`);
    return updatedRole;
  }

  async updateRoleGuru(
    roleId: number,
    subjectId: number,
    currentUser: any,
  ): Promise<UserRole> {
    const executor = `[${currentUser.fullName}] [updateRoleGuru]`;
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
