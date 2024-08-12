import { Controller, Post, Body, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Controller('exam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async createExam(@Body(ValidationPipe) createExamDto: CreateExamDto, @Req() req) {
    const currentUser = req.user;
    return this.examService.createExam(createExamDto, currentUser);
  }
}
