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

  async create(createUserRoleDto: CreateUserRoleDto): Promise<UserRole> {
    const { userId, role } = createUserRoleDto;

    // Fetch the user
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Check for existing role for the user
    const existingUserRole = await this.userRoleRepository.findOne({ where: { user: { id: userId }, role } });
    if (existingUserRole) {
      throw new HttpException(`User dengan role '${role}' sudah terdaftar`, HttpStatus.CONFLICT);
    }

    // Create and save the new user role
    const userRole = this.userRoleRepository.create(createUserRoleDto);
    userRole.user = user;
    return await this.userRoleRepository.save(userRole);
  }

  async findAllByRole(role: string): Promise<UserRole[]> {
    role = role.toUpperCase();
    return await this.userRoleRepository.find({ where: { role } });
  }

  async deleteRole(userRoleId: number) {
    const userRole = await this.userRoleRepository.findOne({ where: { id: userRoleId } });
    if (!userRole) {
      throw new HttpException('Role tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    userRole.statusData = false;
    return await this.userRoleRepository.save(userRole);
  }
}


