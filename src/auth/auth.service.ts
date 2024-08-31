import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    this.logger.log('[login] Start Login');

    const { email, password } = loginDto;

    // Cari pengguna berdasarkan email, termasuk relasi dengan profil dan peran
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['profile', 'userRoles'],
    });

    if (!user) {
      this.logger.error(`[login] User with email ${email} not found`);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Validate user password
    const isValidUser = await this.validateUser(email, password);
    if (!isValidUser) {
      this.logger.error(`[login] Invalid password for email: ${email}`);
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    // Check if the account is verified
    if (!user.isVerified) {
      this.logger.error(`[login] Account with email ${email} is not verified`);
      throw new HttpException('Account not verified', HttpStatus.FORBIDDEN);
    }

    // Ambil role, jika tidak ada set default ke SISWA
    const activeRoles =
      user.userRoles.length > 0
        ? user.userRoles
            .filter((role) => role.statusData === true) // Memfilter role yang aktif
            .map((role) => role.role)
        : [UserRoleEnum.SISWA];

    // Buat payload untuk JWT token
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      roles: activeRoles,
    };

    // Generate token JWT
    const token = this.jwtService.sign(payload);

    this.logger.log(
      `[login] Successfully logged in: ${user.profile?.fullName}, email: ${user.email}`,
    );

    return { token };
  }

  async validateUser(email: string, password: string): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      this.logger.log('[validateUser] Password is valid');
      return user;
    }
    this.logger.error('[validateUser] Invalid password');
    return null;
  }
}
