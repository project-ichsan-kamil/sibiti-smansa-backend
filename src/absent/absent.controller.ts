import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AbsentService } from './absent.service';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum'; // Assumed enum is defined somewhere
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

import { S3Service } from 'src/s3/s3.service';
import { StatusAbsent } from './enum/absent.enum';

@Controller('absents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsentController {
  constructor(
    private readonly absentService: AbsentService,
    private readonly s3Service: S3Service
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './tmp',
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
  }))
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU, UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async create(@Body() createAbsentDto: CreateAbsentDto, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const currentUser = req.user; 
    var urlFile : any;    

    if (createAbsentDto.status !== StatusAbsent.PRESENT) {
      if (!file) {
        throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
      }

      const filePath = path.join(__dirname, '..', '..', 'tmp', file.filename);
    
    
      try {
        urlFile = await this.s3Service.uploadFile(filePath, file.originalname, "absensi");
        fs.unlinkSync(filePath);
      } catch (error) {
        throw new HttpException(`Error uploading file: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    const result = await this.absentService.create(
      createAbsentDto,
      currentUser,
      urlFile
    );
    return {
      statusCode: 201,
      message: 'Absent record created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async getAbsents(@Query() filterDto: any, @Req() req: any) {
    const currentUser = req.user;
    const result = await this.absentService.getAbsents(filterDto, currentUser);
    return {
      statusCode: 200,
      message: 'Absences retrieved successfully',
      count: result.length,
      data: result,
    };
  }

  @Get('check-today')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU, UserRoleEnum.SISWA)
  async checkToday(@Req() req: any): Promise<any> {
    const currentUser = req.user; 
    const result = await this.absentService.checkToday(currentUser);

    return {
      statusCode: 200,
      message: 'Absences retrieved successfully',
      data: result,
    };
  }

  @Get('monthly')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU, UserRoleEnum.SISWA)
  async getAbsentsByMonthAndYear(
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req : any,
  ) {
    const currentUser = req.user; 
    const result =  await this.absentService.getAbsentsUserByMonthAndYear(currentUser, month, year);
    return {
      statusCode: 200,
      message: 'Absences retrieved successfully',
      data: result,
    };
  }
}
