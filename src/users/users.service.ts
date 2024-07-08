import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NumericType, Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly encryptionService: EncryptionService,
    private readonly emailService: EmailService,

  ) {}

  async createUser(createUserDto: CreateUserDto, currentUser: any): Promise<any> {    // TODO : check is admin
    const { username, password, email, noHp, fullName } = createUserDto;

    this.logger.log('[createUser] Checking if username is already registered');
    const existingUser = await this.usersRepository.findOne({
      where: { username, statusData: true },
    });

    if (existingUser) {
      this.logger.error(`[createUser] Username "${username}" is already registered`);
      throw new HttpException('Username sudah terdaftar', HttpStatus.CONFLICT);
    }

    this.logger.log('[createUser] Encrypting the password');
    const hashedPassword = await hash(password, 10);

    const queryRunner =
      this.usersRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('[createUser] Creating user');
      const user = new Users();
      user.username = username;
      user.password = hashedPassword;
      user.updatedBy = currentUser.fullName

      const savedUser = await queryRunner.manager.save(user);
      this.logger.log('[createUser] User created successfully');

      this.logger.log('[createUser] Creating user profile');
      const userProfile = new ProfileUser();
      userProfile.user = savedUser;
      userProfile.email = email;
      userProfile.noHp = noHp;
      userProfile.fullName = fullName;
      userProfile.encrypt = this.encryptionService.encrypt(`${password}`); // Tambahkan ini
      userProfile.updatedBy = currentUser.fullName;

      await queryRunner.manager.save(userProfile);
      this.logger.log('[createUser] User profile created successfully');
      await queryRunner.commitTransaction();

      return savedUser;
    } catch (error) {
      this.logger.error('[createUser] Error creating user', error.stack);

      await queryRunner.rollbackTransaction();
      throw new HttpException(
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateUserProfile(userId: number, updateUserDto: UpdateUserDto, currentUser: any): Promise<any> {   // TODO : check is admin
    this.logger.log(`[updateUserProfile] Updating profile for user with ID ${userId}`);
    
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
  
    if (!user || !user.profile) {
      this.logger.error(`[updateUserProfile] Profile for user with ID ${userId} not found`);
      throw new HttpException('User profile tidak ditemukan', HttpStatus.NOT_FOUND);
    }
  
    const userProfile = user.profile;
  
    if (updateUserDto.email) {
      userProfile.email = updateUserDto.email;
    }
  
    if (updateUserDto.noHp) {
      userProfile.noHp = updateUserDto.noHp;
    }
  
    if (updateUserDto.fullName) {
      userProfile.fullName = updateUserDto.fullName;
    }
  
    if (updateUserDto.password) {
      this.logger.log('[updateUserProfile] Encrypting the password');
      const hashedPassword = await hash(updateUserDto.password, 10);
      user.password = hashedPassword; // Update the hashed password in the Users table
      userProfile.encrypt = this.encryptionService.encrypt(updateUserDto.password); // Encrypt the plain password for ProfileUser
    }    
    
    userProfile.updatedBy = currentUser.fullName;
    await this.usersRepository.manager.save(userProfile);
    await this.usersRepository.save(user);
    
    this.logger.log(`[updateUserProfile] Profile for user with ID ${userId} updated successfully`);
  
    return userProfile;
  }
  
  
  async verifyUser(verifyUserId: number, currentUser: any): Promise<any> {    // TODO : check is admin
    this.logger.log(`[verifyUser] Verifying user with ID ${verifyUserId}`);
    const user = await this.usersRepository.findOne({
      where: { id: verifyUserId },
      relations: ['profile'],
    });

    if (!user) {
      this.logger.error(`[verifyUser] User with ID ${verifyUserId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    user.updatedBy = currentUser.fullName;
    user.isVerified = true; 

    await this.usersRepository.save(user);
    const passwordEncrypted = this.encryptionService.decrypt(user.profile.encrypt);
    console.log(passwordEncrypted);
    

    this.logger.log(`[verifyUser] Sending email to user with ID ${verifyUserId}`);
    await this.emailService.sendPassword(user.profile.email, passwordEncrypted);
    this.logger.log(`[verifyUser] User with ID ${verifyUserId} verified successfully`);
    return user;
  }

  async inActiveUser(inActiveUserId: number, currentUser: any): Promise<any> {    // TODO : check is admin
    this.logger.log(`[inActiveUser] Inactive user with ID ${inActiveUserId}`);
    const user = await this.usersRepository.findOne({ where: { id: inActiveUserId } });

    if (!user) {
      this.logger.error(`[inActiveUser] User with ID ${inActiveUserId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    user.updatedBy = currentUser.fullName;
    user.isVerified = false; 

    await this.usersRepository.save(user);
    this.logger.log(`[inActiveUser] User with ID ${inActiveUserId} inactive successfully`);

    return user;
  }


  async getUnverifiedUsers(): Promise<any[]> {
    const unverifiedUsers = await this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isVerified = :isVerified', { isVerified: false })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select([
        'user.id',
        'user.username',
        'profile.encrypt',
        'profile.fullName',
        'profile.email',
        'profile.noHp'
      ])
      .orderBy('GREATEST(user.updatedAt, profile.updatedAt)', 'DESC')
      .getMany();

       // Dekripsi data
    unverifiedUsers.forEach(user => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(user.profile.encrypt);
        user.profile.encrypt = decryptedData;
      }
    });

    return unverifiedUsers;
  }

  async getUserByUserId(userId: number): Promise<any> {
    const user = await this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.id = :userId', { userId })
      .select([
        'user.id',
        'user.username',
        'profile.encrypt',
        'profile.fullName',
        'profile.email',
        'profile.noHp'
      ])
      .getOne();

    if (!user) {
      this.logger.error(`[getUserByUserId] User with ID ${userId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Dekripsi data
    if (user.profile && user.profile.encrypt) {
      const decryptedData = this.encryptionService.decrypt(user.profile.encrypt);
      user.profile.encrypt = decryptedData;
    }

    return user;
  }

  async deleteUser(userId: number, currentUser: any): Promise<any> {
    this.logger.log(`[deleteUser] Deleting user with ID ${userId}`);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.error(`[deleteUser] User with ID ${userId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    user.updatedBy = currentUser.fullName;
    user.statusData = false;

    await this.usersRepository.save(user);
    this.logger.log(`[deleteUser] User with ID ${userId} deleted successfully`);

    return user;
  }

  async searchUserByFullName(fullName: string): Promise<any> {
    this.logger.log(`[searchUserByFullName] Searching users with full name: ${fullName}`);
    
    const users = await this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('profile.fullName LIKE :fullName', { fullName: `%${fullName}%` })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select([
        'user.id',
        'user.username',
        'profile.encrypt',
        'profile.fullName',
        'profile.email',
        'profile.noHp'
      ])
      .getMany();
      
    // Dekripsi data
    users.forEach(user => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(user.profile.encrypt);
        user.profile.encrypt = decryptedData;
      }
    });

    return users;
  }
}
