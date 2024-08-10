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

  // Method to create a role
  async createRole(
    role: UserRoleEnum,
    userId: number,
    subjectId: number,
    currentUser: any,
  ): Promise<UserRole> {
    const executor = `[${currentUser.fullName}][createRole]`;
    this.logger.log(`${executor} Starting role creation`);
  
    // Memeriksa apakah currentUser adalah GURU
    const isGuru = await this.isGuru(currentUser.userId);    
    if (isGuru) {
      this.logger.error(`${executor} Gurus are not allowed to create roles`);
      throw new HttpException(
        'Guru tidak diperbolehkan untuk membuat role',
        HttpStatus.FORBIDDEN,
      );
    }
  
    // Cek apakah sudah ada Super Admin yang terdaftar
    if (role === UserRoleEnum.SUPER_ADMIN) {
      const existingSuperAdmin = await this.userRoleRepository.findOne({
        where: { role: UserRoleEnum.SUPER_ADMIN, statusData: true },
      });
      if (existingSuperAdmin) {
        this.logger.error(`${executor} There is already an account with SUPER_ADMIN role`);
        throw new HttpException(
          'Sudah ada akun dengan role Super Admin yang terdaftar',
          HttpStatus.FORBIDDEN,
        );
      }
    }
  
    // Memeriksa apakah currentUser adalah SUPER_ADMIN
    if (role === UserRoleEnum.ADMIN || role === UserRoleEnum.GURU) {
      const isSuperAdmin = await this.isSuperAdmin(currentUser.id);
      if (!isSuperAdmin) {
        this.logger.error(
          `${executor} Only super admin can create ADMIN or GURU roles`,
        );
        throw new HttpException(
          'Hanya Super Admin yang dapat membuat role Admin atau Guru',
          HttpStatus.FORBIDDEN,
        );
      }
    }
  
    // Memeriksa apakah currentUser adalah ADMIN atau SUPER_ADMIN
    if (role === UserRoleEnum.GURU) {
      const isSuperAdminOrAdmin = await this.isSuperAdminOrAdmin(currentUser.id);
      if (!isSuperAdminOrAdmin || !subjectId) {
        this.logger.error(
          `${executor} Subject ID is required when creating a GURU role`,
        );
        throw new HttpException(
          'Mata Pelajaran diperlukan saat membuat role GURU',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    // Cek apakah user sudah terdaftar dengan role yang sama
    const existingRole = await this.userRoleRepository.findOne({
      where: { user: { id: userId }, role: role, statusData: true },
    });
    if (existingRole) {
      this.logger.error(`${executor} User already has this role`);
      throw new HttpException(
        'User sudah terdaftar dengan role yang sama',
        HttpStatus.CONFLICT,
      );
    }
  
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`${executor} User not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }
  
    // Cek apakah user telah diverifikasi
    if (!user.isVerified) {
      this.logger.error(`${executor} User is not verified`);
      throw new HttpException('User belum diverifikasi', HttpStatus.FORBIDDEN);
    }
  
    let subject: Subject;
    if (role === UserRoleEnum.GURU) {
      subject = await this.subjectRepository.findOne({
        where: { id: subjectId },
      });
      if (!subject) {
        this.logger.error(`${executor} Subject not found`);
        throw new HttpException('Mata Pelajaran tidak ditemukan', HttpStatus.NOT_FOUND);
      }
    }
  
    const userRole = new UserRole();
    userRole.user = user;
    userRole.role = role;
    userRole.subject = subject;
    userRole.createdBy = currentUser.fullName;
    userRole.updatedBy = currentUser.fullName;
  
    const savedRole = await this.userRoleRepository.save(userRole);
    this.logger.log(`${executor} Role created successfully`);
    return savedRole;
  }
  
  
  

  // Method to search user by full name
  // async searchUserByFullName(fullName: string): Promise<Users[]> {
  //   return this.userRepository.find({
  //     where: { fullName: `%${fullName}%` },
  //     relations: ['userRoles'],
  //   });
  // }

  // // Method to delete a role
  // async deleteRole(roleId: number, currentUser: any): Promise<void> {
  //     const role = await this.userRoleRepository.findOne(roleId, { relations: ['user'] });
  //     if (!role) {
  //         throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  //     }

  //     if (role.role === UserRoleEnum.GURU && currentUser.role === UserRoleEnum.ADMIN) {
  //         if (role.user.id !== currentUser.id) {
  //             throw new HttpException('Admins can only delete their own GURU roles', HttpStatus.FORBIDDEN);
  //         }
  //     } else if (currentUser.role !== UserRoleEnum.SUPER_ADMIN) {
  //         throw new HttpException('Only super admin can delete roles', HttpStatus.FORBIDDEN);
  //     }

  //     await this.userRoleRepository.remove(role);
  // }

  // // Method to update a role
  // async updateRole(roleId: number, updatedRoleData: Partial<UserRole>, currentUser: any): Promise<UserRole> {
  //     const role = await this.userRoleRepository.findOne(roleId, { relations: ['user'] });
  //     if (!role) {
  //         throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  //     }

  //     if (role.role === UserRoleEnum.GURU && currentUser.role === UserRoleEnum.ADMIN) {
  //         if (role.user.id !== currentUser.id) {
  //             throw new HttpException('Admins can only update their own GURU roles', HttpStatus.FORBIDDEN);
  //         }
  //     } else if (currentUser.role !== UserRoleEnum.SUPER_ADMIN) {
  //         throw new HttpException('Only super admin can update roles', HttpStatus.FORBIDDEN);
  //     }

  //     Object.assign(role, updatedRoleData);
  //     role.updatedBy = currentUser.fullName;

  //     return this.userRoleRepository.save(role);
  // }

  // // Method to get users by role
  // async getUsersByRole(role: UserRoleEnum): Promise<Users[]> {
  //     return this.userRepository
  //         .createQueryBuilder('user')
  //         .leftJoinAndSelect('user.userRoles', 'userRole')
  //         .where('userRole.role = :role', { role })
  //         .getMany();
  // }

  // // Method to get role by role ID
  // async getRoleByRoleId(roleId: number): Promise<UserRole> {
  //     const role = await this.userRoleRepository.findOne(roleId, { relations: ['user', 'subject'] });
  //     if (!role) {
  //         throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  //     }
  //     return role;
  // }

  async isSuperAdmin(userId: number): Promise<boolean> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role: UserRoleEnum.SUPER_ADMIN,
        statusData: true,
      },
    });
    return !!userRole;
  }

  async isSuperAdminOrAdmin(userId: number): Promise<boolean> {
    const userRole = await this.userRoleRepository.findOne({
      where: [
        {
          user: { id: userId },
          role: UserRoleEnum.SUPER_ADMIN,
          statusData: true,
        },
        {
          user: { id: userId },
          role: UserRoleEnum.ADMIN,
          statusData: true,
        },
      ],
    });
    return !!userRole;
  }

  async isGuru(userId: number): Promise<boolean> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        user: { id: userId },
        role: UserRoleEnum.GURU,
        statusData: true,
      },
    });
    return !!userRole;
  }
  
}
