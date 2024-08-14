import { Controller, Post, Body, Req, UseGuards, ValidationPipe, HttpStatus, Patch, Query } from '@nestjs/common';
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

  @Post('create-quiz-daily-test')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async createExam(@Body(ValidationPipe) createExamDto: CreateExamDto, @Req() req) {
    const currentUser = req.user;
    const result = await this.examService.createExamQuisAndUH(createExamDto, currentUser);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Exam created successfully',
      data: result,
    };
  }

  @Patch('publish')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async publishExam(
    @Query('examId') examId: number,
    @Req() req: any
  ) {
    const currentUser = req.user;
    const updatedExam = await this.examService.publishExam(examId, currentUser);

    return {
      statusCode: HttpStatus.OK,
      message: 'Exam published successfully',
      data: updatedExam,
    };
  }
}
