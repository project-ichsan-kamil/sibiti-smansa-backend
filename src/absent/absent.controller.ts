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
} from '@nestjs/common';
import { AbsentService } from './absent.service';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum'; // Assumed enum is defined somewhere

@Controller('absents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsentController {
  constructor(private readonly absentService: AbsentService) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.GURU, UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async create(@Body() createAbsentDto: CreateAbsentDto, @Req() req: any) {
    const currentUser = req.user; // assuming JWT middleware adds user details
    const result = await this.absentService.create(
      createAbsentDto,
      currentUser,
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
}
