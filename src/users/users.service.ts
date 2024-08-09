import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from 'src/common/email/email.service';
import { UserRoleService } from 'src/user-role/user-role.service';
import { UserClass } from 'src/class/entities/user-class.entity';
import { Class } from 'src/class/entities/class.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    private readonly encryptionService: EncryptionService,
    private readonly emailService: EmailService,
    private readonly userRoleService: UserRoleService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    currentUser: any,
  ): Promise<any> {
    this.logger.log('[createUser] Initiating user creation process');
    
    try {
      // Check if current user is a super admin
      await this.checkIfSuperAdmin(currentUser);
    
      const { password, email, noHp, fullName, classId } = createUserDto;
    
      // Check if email is already registered
      const existingUser = await this.usersRepository.findOne({
        where: { email, statusData: true },
      });

      if (existingUser) {
        this.logger.error(`[createUser] Email "${email}" is already registered`);
        throw new HttpException('Email sudah terdaftar', HttpStatus.CONFLICT);
      }
    
      // Encrypt the password
      const hashedPassword = await hash(password, 10);
    
      const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    
      try {
        // Create user and profile
        const user = new Users();
        user.email = email;
        user.password = hashedPassword;
        user.updatedBy = currentUser.fullName;
    
        const savedUser = await queryRunner.manager.save(user);
    
        const userProfile = new ProfileUser();
        userProfile.user = savedUser;
        userProfile.noHp = noHp;
        userProfile.fullName = fullName;
        userProfile.encrypt = this.encryptionService.encrypt(`${password}`);
        userProfile.updatedBy = currentUser.fullName;
    
        await queryRunner.manager.save(userProfile);
    
        // Associate user with class if classId is provided
        if (classId) {
          const classEntity = await this.classRepository.findOne({
            where: { id: classId, statusData: true },
          });
    
          if (!classEntity) {
            this.logger.error(`[createUser] Class with ID "${classId}" not found or is inactive`);
            throw new HttpException('Kelas tidak ditemukan atau tidak aktif', HttpStatus.NOT_FOUND);
          }
    
          const userClassAssociation = new UserClass();
          userClassAssociation.user = savedUser;
          userClassAssociation.classEntity = classEntity;
          userClassAssociation.statusData = true;
          userClassAssociation.createdBy = currentUser.fullName;
          userClassAssociation.updatedBy = currentUser.fullName;
    
          await queryRunner.manager.save(userClassAssociation);
        }
    
        await queryRunner.commitTransaction();
    
        this.logger.log('[createUser] User creation process completed successfully');
        return { user: savedUser };
      } catch (innerError) {
        this.logger.error('[createUser] Error during transaction', innerError.stack);
        await queryRunner.rollbackTransaction();
        throw new HttpException('Error creating user', HttpStatus.INTERNAL_SERVER_ERROR);
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('[createUser] Error during user creation process', error.stack);
      throw error;
    }
  }

  async verifyUser(verifyUserId: number, currentUser: any): Promise<any> {
    this.logger.log(`[verifyUser] Starting verification for user with ID ${verifyUserId}`);

    // Check if the current user is a super admin
    this.logger.log('[verifyUser] Checking if current user is super admin');
    const isSuperAdmin = await this.userRoleService.isSuperAdmin(currentUser.id);
    if (!isSuperAdmin) {
      this.logger.error(
        '[verifyUser] Current user is not super admin, aborting verification',
      );
      throw new HttpException(
        'Only super admin can verify a user',
        HttpStatus.FORBIDDEN,
      );
    }

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

    this.logger.log(`[verifyUser] Sending email to user with ID ${verifyUserId}`);
    await this.emailService.sendPassword(user.email, passwordEncrypted);
    
    this.logger.log(`[verifyUser] User with ID ${verifyUserId} verified successfully`);
    return user;
  }

  async inActiveUser(inActiveUserId: number, currentUser: any): Promise<any> {
    this.logger.log(`[inActiveUser] Starting process to inactivate user with ID ${inActiveUserId}`);

    // Check if the current user is a super admin
    this.logger.log('[inActiveUser] Checking if current user is super admin');
    const isSuperAdmin = await this.userRoleService.isSuperAdmin(currentUser.id);
    if (!isSuperAdmin) {
      this.logger.error('[inActiveUser] Current user is not super admin, aborting inactivation');
      throw new HttpException(
        'Only super admin can inactivate a user',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: inActiveUserId },
    });

    if (!user) {
      this.logger.error(`[inActiveUser] User with ID ${inActiveUserId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    user.updatedBy = currentUser.fullName;
    user.isVerified = false;

    await this.usersRepository.save(user);
    this.logger.log(`[inActiveUser] User with ID ${inActiveUserId} inactivated successfully`);

    return user;
  }

  async getUnverifiedUsers(): Promise<any[]> {
    const unverifiedUsers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isVerified = :isVerified', { isVerified: false })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select([
        'user.id',
        'user.username',
        'profile.encrypt',
        'profile.fullName',
        'profile.email',
        'profile.noHp',
      ])
      .orderBy('GREATEST(user.updatedAt, profile.updatedAt)', 'DESC')
      .getMany();

    // Dekripsi data
    unverifiedUsers.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });

    return unverifiedUsers;
  }

  async getVerifiedUsers(): Promise<any[]> {
    const verifiedUsers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isVerified = :isVerified', { isVerified: true })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select(['user.id', 'user.username', 'profile.fullName', 'profile.email'])
      .orderBy('profile.fullName', 'ASC')
      .getMany();

    // Dekripsi data
    verifiedUsers.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });

    return verifiedUsers;
  }

  async getUserByUserId(userId: number): Promise<any> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.id = :userId', { userId })
      .select([
        'user.id',
        'user.email',
        'profile.encrypt',
        'profile.fullName',
        'profile.noHp',
      ])
      .getOne();

    if (!user) {
      this.logger.error(`[getUserByUserId] User with ID ${userId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Dekripsi data
    if (user.profile && user.profile.encrypt) {
      const decryptedData = this.encryptionService.decrypt(
        user.profile.encrypt,
      );
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
    this.logger.log(
      `[searchUserByFullName] Searching users with full name: ${fullName}`,
    );

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('profile.fullName LIKE :fullName', { fullName: `%${fullName}%` })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select([
        'user.id',
        'user.username',
        'profile.encrypt',
        'profile.fullName',
        'profile.email',
        'profile.noHp',
      ])
      .getMany();

    // Dekripsi data
    users.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });

    return users;
  }

  private async checkIfSuperAdmin(currentUser: any): Promise<void> {
    this.logger.log('[checkIfSuperAdmin] Checking if current user is super admin');
    const isSuperAdmin = await this.userRoleService.isSuperAdmin(currentUser.id);
    if (!isSuperAdmin) {
      this.logger.error(
        '[checkIfSuperAdmin] Current user is not super admin, aborting user creation',
      );
      throw new HttpException(
        'Only super admin can create a new user',
        HttpStatus.FORBIDDEN,
      );
    }
  }
  
}
