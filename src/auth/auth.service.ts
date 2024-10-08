import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { EmailService } from 'src/common/email/email.service';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { EncryptionService } from 'src/common/encryption/encryption.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(ProfileUser)
    private readonly profileRepository: Repository<ProfileUser>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
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
      throw new HttpException('Email belum terdaftar', HttpStatus.NOT_FOUND);
    }

    // Validate user password
    const isValidUser = await this.validateUser(email, password);
    if (!isValidUser) {
      this.logger.error(`[login] Invalid password for email: ${email}`);
      throw new HttpException('Password salah', HttpStatus.UNAUTHORIZED);
    }

    // Check if the account is verified
    if (!user.isVerified) {
      this.logger.error(`[login] Account with email ${email} is not verified`);
      throw new HttpException('Akun belum terverifikasi', HttpStatus.FORBIDDEN);
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

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('Email tidak terdaftar', HttpStatus.NOT_FOUND);
    }

    // Generate JWT token
    const token = this.jwtService.sign({ id: user.id });
    
    // Kirim email dengan link reset password
    const resetLink = `http://yourdomain.com/change-password/${token}`;
    await this.emailService.sendPassword(email, resetLink);
  }

  async changePassword(token: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    let decodedToken;
  
    try {
      decodedToken = this.jwtService.verify(token);
    } catch (error) {
      console.log(error);
      
      throw new HttpException('Token tidak valid atau telah kedaluwarsa', HttpStatus.UNAUTHORIZED);
    }
  
    const userId = decodedToken.id;
  
    const user = await this.usersRepository.findOne({ where: { id: userId, statusData: true } });
    if (!user) {
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }
  
    // Hash password baru
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    const userProfile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
    if (!userProfile) {
      throw new HttpException('User profile tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    userProfile.encrypt = await this.encryptionService.encrypt(changePasswordDto.newPassword);
  
    await this.usersRepository.save(user);
    await this.profileRepository.save(userProfile);
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
