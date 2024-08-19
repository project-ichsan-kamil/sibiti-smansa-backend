import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AbsentService } from './absent.service';
import { CreateAbsentDto } from './dto/create-absent.dto';
import { UpdateAbsentDto } from './dto/update-absent.dto';
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
    const createdBy = req.user.fullName;  // assuming JWT middleware adds user details
    const result = await this.absentService.create(createAbsentDto, createdBy);
    return {
      statusCode: 201,
      message: 'Absent record created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async findAll() {
    const result = await this.absentService.findAll();
    return {
      statusCode: 200,
      message: 'All absent records retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.GURU, UserRoleEnum.SISWA)
  async findOne(@Param('id') id: number) {
    const result = await this.absentService.findOne(id);
    return {
      statusCode: 200,
      message: `Absent record with ID ${id} retrieved successfully`,
      data: result,
    };
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  @UsePipes(ValidationPipe)
  async update(@Param('id') id: number, @Body() updateAbsentDto: UpdateAbsentDto, @Req() req: any) {
    const updatedBy = req.user.fullName;
    const result = await this.absentService.update(id, updateAbsentDto, updatedBy);
    return {
      statusCode: 200,
      message: `Absent record with ID ${id} updated successfully`,
      data: result,
    };
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  async remove(@Param('id') id: number) {
    await this.absentService.remove(id);
    return {
      statusCode: 200,
      message: `Absent record with ID ${id} deleted successfully`,
    };
  }
}
