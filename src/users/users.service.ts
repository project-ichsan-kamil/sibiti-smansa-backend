import * as ExcelJS from 'exceljs';
import { Multer } from 'multer';
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
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[createUser] Initiating user creation process`);
    
    try {
      await this.checkIfSuperAdmin(currentUser);
      const { password, email, noHp, fullName, classId } = createUserDto;
    
      const existingUser = await this.usersRepository.findOne({
        where: { email, statusData: true },
      });

      if (existingUser) {
        this.logger.error(`${executor}[createUser] Email "${email}" is already registered`);
        throw new HttpException(`Email "${email}" sudah terdaftar`, HttpStatus.CONFLICT);
      }
    
      const hashedPassword = await hash(password, 10);
      const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    
      try {
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
    
        if (classId) {
          const classEntity = await this.classRepository.findOne({
            where: { id: classId, statusData: true },
          });
    
          if (!classEntity) {
            this.logger.error(`${executor}[createUser] Class with ID "${classId}" not found or is inactive`);
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
    
        this.logger.log(`${executor}[createUser] User creation process completed successfully`);
        return { user: savedUser };
      } catch (innerError) {
        this.logger.error(`${executor}[createUser] Error during transaction`, innerError.stack);
        await queryRunner.rollbackTransaction();
        throw new HttpException('Error creating user', HttpStatus.INTERNAL_SERVER_ERROR);
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`${executor}[createUser] Error during user creation process`, error.stack);
      throw error;
    }
  }

  async verifyUsers(verifyUserIds: number[], currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[verifyUsers] Verifying users with IDs: ${verifyUserIds.join(', ')}`);
  
    // Memeriksa apakah pengguna saat ini adalah super admin menggunakan fungsi checkIfSuperAdmin
    await this.checkIfSuperAdmin(currentUser);
  
    const verifiedUsers = [];
    const emailSendPromises = [];
  
    for (const verifyUserId of verifyUserIds) {
      const user = await this.usersRepository.findOne({
        where: { id: verifyUserId },
        relations: ['profile'],
      });
  
      if (!user) {
        this.logger.warn(`${executor}[verifyUsers] User with ID ${verifyUserId} not found`);
        continue; // Skip this user and continue with the next one
      }
  
      user.updatedBy = currentUser.fullName;
      user.isVerified = true;
  
      await this.usersRepository.save(user);
  
      const passwordEncrypted = this.encryptionService.decrypt(user.profile.encrypt);
      
      // Simpan promise pengiriman email
      emailSendPromises.push(
        this.emailService.sendPassword(user.email, passwordEncrypted)
          .then(() => {
            this.logger.log(`${executor}[verifyUsers] Email sent successfully to user with ID ${verifyUserId}`);
          })
          .catch(error => {
            this.logger.error(`${executor}[verifyUsers] Failed to send email to user with ID ${verifyUserId}: ${error.message}`);
          })
      );
  
      this.logger.log(`${executor}[verifyUsers] User with ID ${verifyUserId} verified successfully`);
      verifiedUsers.push(user);
    }
  
    // Tunggu semua email terkirim
    await Promise.all(emailSendPromises);
  
    this.logger.log(`${executor}[verifyUsers] Verification completed for users with IDs: ${verifyUserIds.join(', ')}`);
    return verifiedUsers;
  }
  

  async inActivateUsers(inActiveUserIds: number[], currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[inActivateUsers] Starting process to inactivate users with IDs: ${inActiveUserIds.join(', ')}`);
  
    // Memeriksa apakah pengguna saat ini adalah super admin menggunakan fungsi checkIfSuperAdmin
    await this.checkIfSuperAdmin(currentUser);
  
    const inactivatedUsers = [];
  
    for (const inActiveUserId of inActiveUserIds) {
      const user = await this.usersRepository.findOne({
        where: { id: inActiveUserId },
      });
  
      if (!user) {
        this.logger.warn(`${executor}[inActivateUsers] User with ID ${inActiveUserId} not found`);
        continue; // Skip this user and continue with the next one
      }
  
      user.updatedBy = currentUser.fullName;
      user.isVerified = false;
  
      await this.usersRepository.save(user);
      this.logger.log(`${executor}[inActivateUsers] User with ID ${inActiveUserId} inactivated successfully`);
  
      inactivatedUsers.push(user);
    }
  
    this.logger.log(`${executor}[inActivateUsers] Inactivation process completed for users with IDs: ${inActiveUserIds.join(', ')}`);
    return inactivatedUsers;
  }
  

  async getUnverifiedUsers(currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[getUnverifiedUsers] Retrieving unverified users`);
  
    await this.checkIfSuperAdmin(currentUser);
  
    const unverifiedUsers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isVerified = :isVerified', { isVerified: false })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select([
        'user.id',
        'user.email',
        'profile.encrypt',
        'profile.fullName',
        'profile.noHp',
      ])
      .orderBy('GREATEST(user.updatedAt, profile.updatedAt)', 'DESC')
      .getMany();
  
    unverifiedUsers.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });
  
    this.logger.log(`${executor}[getUnverifiedUsers] Retrieved ${unverifiedUsers.length} unverified users`);
    return unverifiedUsers;
  }
  
  async getVerifiedUsers(currentUser: any): Promise<any[]> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[getVerifiedUsers] Retrieving verified users`);
  
    await this.checkIfSuperAdmin(currentUser);
  
    const verifiedUsers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isVerified = :isVerified', { isVerified: true })
      .andWhere('user.statusData = :statusData', { statusData: true })
      .select(['user.id', 'user.email', 'profile.fullName', 'profile.encrypt'])
      .orderBy('profile.fullName', 'ASC')
      .getMany();
  
    verifiedUsers.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });
  
    this.logger.log(`${executor}[getVerifiedUsers] Retrieved ${verifiedUsers.length} verified users`);
    return verifiedUsers;
  }

  async getUserByUserId(userId: number, currentUser: any): Promise<any> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[getUserByUserId] Retrieving user with ID ${userId}`);

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
      this.logger.error(`${executor}[getUserByUserId] User with ID ${userId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    if (user.profile && user.profile.encrypt) {
      const decryptedData = this.encryptionService.decrypt(
        user.profile.encrypt,
      );
      user.profile.encrypt = decryptedData;
    }

    this.logger.log(`${executor}[getUserByUserId] Retrieved user with ID ${userId}`);
    return user;
  }

  async deleteUser(userId: number, currentUser: any): Promise<any> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[deleteUser] Deleting user with ID ${userId}`);

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.error(`${executor}[deleteUser] User with ID ${userId} not found`);
      throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    user.updatedBy = currentUser.fullName;
    user.statusData = false;

    await this.usersRepository.save(user);
    this.logger.log(`${executor}[deleteUser] User with ID ${userId} deleted successfully`);

    return user;
  }

  async searchUserByFullName(fullName: string, currentUser: any): Promise<any> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[searchUserByFullName] Searching users with full name: ${fullName}`);

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

    users.forEach((user) => {
      if (user.profile && user.profile.encrypt) {
        const decryptedData = this.encryptionService.decrypt(
          user.profile.encrypt,
        );
        user.profile.encrypt = decryptedData;
      }
    });

    this.logger.log(`${executor}[searchUserByFullName] Found ${users.length} users with full name "${fullName}"`);
    return users;
  }

  async createUserFormTemplateExcel(file: Multer.File, currentUser: any): Promise<any> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[createUserFormTemplateExcel] Starting Excel file processing`);
  
    await this.checkIfSuperAdmin(currentUser);
    const workbook = new ExcelJS.Workbook();
  
    try {
      await workbook.xlsx.load(file.buffer);
    } catch (error) {
      this.logger.error(`${executor}[createUserFormTemplateExcel] Error loading Excel file: ${error.message}`, error.stack);
      throw new HttpException('Failed to load Excel file', HttpStatus.BAD_REQUEST);
    }
  
    const errorMessages: string[] = [];
  
    for (const worksheet of workbook.worksheets) {
      const className = worksheet.name;
      let classId: number | null = null;
  
      if (className !== 'Guru') {
        try {
          const classEntity = await this.classRepository.findOne({
            where: { name: className, statusData: true },
          });
  
          if (!classEntity) {
            const errorMessage = `Class with name "${className}" not found or is inactive`;
            this.logger.error(`${executor}[createUserFormTemplateExcel] ${errorMessage}`);
            errorMessages.push(errorMessage);
            continue;
          }
  
          classId = classEntity.id;
        } catch (error) {
          const errorMessage = `Error finding class with name "${className}": ${error.message}`;
          this.logger.error(`${executor}[createUserFormTemplateExcel] ${errorMessage}`, error.stack);
          errorMessages.push(errorMessage);
          continue;
        }
      }
  
      worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber <= 1) return;
  
        const createUserDto: CreateUserDto = {
          fullName: String(row.getCell(2).value),
          email: String(row.getCell(3).value),
          password: String(row.getCell(4).value),
          noHp: String(row.getCell(5).value),
          ...(className !== 'Guru' && { classId }),
        };
  
        this.logger.log(`${executor}[createUserFormTemplateExcel] Creating user for row ${rowNumber} in class "${className}"`);
  
        try {
          await this.createUser(createUserDto, currentUser);
        } catch (error) {
          const errorMessage = `Error processing row ${rowNumber} in class "${className}": ${error.message}`;
          this.logger.error(`${executor}[createUserFormTemplateExcel] ${errorMessage}`, error.stack);
          errorMessages.push(errorMessage);
        }
      });
    }
  
    if (errorMessages.length > 0) {
      this.logger.warn(`${executor}[createUserFormTemplateExcel] Completed with errors: ${errorMessages.join('; ')}`);
      throw new HttpException(
        {
          message: `Excel file processed with some errors: ${errorMessages.join('; ')}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  
    this.logger.log(`${executor}[createUserFormTemplateExcel] Excel file processed successfully`);
    return { message: 'Excel file processed successfully' };
  }

  private async checkIfSuperAdmin(currentUser: any): Promise<void> {
    const executor = `[${currentUser.fullName}]`;
    this.logger.log(`${executor}[checkIfSuperAdmin] Checking if current user is super admin`);
    const isSuperAdmin = await this.userRoleService.isSuperAdmin(currentUser.id);
    if (!isSuperAdmin) {
      this.logger.error(
        `${executor}[checkIfSuperAdmin] Current user is not super admin, aborting user creation`,
      );
      throw new HttpException(
        'Only super admin can create a new user',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}