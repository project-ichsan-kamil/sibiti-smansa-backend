import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { Users } from 'src/users/entities/user.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createUserRoleDto: CreateUserRoleDto, currentUser: any): Promise<UserRole> {
    const { userId, role } = createUserRoleDto;

    // Fetch the user
    const user = await this.usersRepository.findOne({ where: { id: userId} });
    if (!user) {
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Check for existing role for the user
    const existingUserRole = await this.userRoleRepository.findOne({ where: { user: { id: userId }, role, statusData: true } });
    if (existingUserRole) {
      throw new HttpException(`User ini sudah terdaftar dengan role ${role}`, HttpStatus.CONFLICT);
    }

    // Create and save the new user role
    const userRole = this.userRoleRepository.create(createUserRoleDto);
    userRole.user = user;
    userRole.updatedBy = currentUser.fullName
    return await this.userRoleRepository.save(userRole);
  }



  async deleteRole(userRoleId: number, currentUser: any){
    const userRole = await this.userRoleRepository.findOne({ where: { id: userRoleId } });
    if (!userRole) {
      throw new HttpException('User role tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    userRole.statusData = false;
    userRole.updatedBy = currentUser.fullName;
    return await this.userRoleRepository.save(userRole);
  }

  async searchByRoleAndName(role: string, name: string): Promise<any> {
    role = role.toLowerCase();
    const users = await this.userRoleRepository.createQueryBuilder('userRole')
        .leftJoinAndSelect('userRole.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .select(['userRole.id AS id', 'user.id AS userId', 'profile.fullname AS fullname'])
        .where('userRole.role = :role', { role })
        .andWhere('userRole.statusData = :statusData', { statusData: true }) // Add this line
        .andWhere('LOWER(profile.fullname) LIKE :name', { name: `%${name.toLowerCase()}%` })
        .orderBy('userRole.updatedAt', 'DESC')
        .getRawMany();

    return users;
  }
}


