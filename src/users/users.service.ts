import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const { username, password } = createUserDto;

    this.logger.log('[createUser] Checking if username is already registered');
    const existingUser = await this.usersRepository.findOne({
      where: { username },
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

      const savedUser = await queryRunner.manager.save(user);
      this.logger.log('[createUser] User created successfully');

      this.logger.log('[createUser] Creating user profile');
      const userProfile = new ProfileUser();
      userProfile.user = savedUser;

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
}
