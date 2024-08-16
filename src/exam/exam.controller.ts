import { Controller, Post, Body, Req, UseGuards, ValidationPipe, HttpStatus, Patch, Query } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateQuizDailyExamDto } from './dto/create-quiz-daily-exam.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { CreateUasUtsDto } from './dto/create-uas-uts-exam.dto';

@Controller('exam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('create-quiz-daily-exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async createExamQuisAndUH(
    @Body(ValidationPipe) createQuisDailyExamDto: CreateQuizDailyExamDto,
    @Req() req: any
  ) {
    const currentUser = req.user;
    const result = await this.examService.createExamQuisAndUH(createQuisDailyExamDto, currentUser);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Quiz/Daily Exam created successfully',
      data: result,
    };
  }

  @Post('create-uts-uas-exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async createExamUasUts(
    @Body(ValidationPipe) createUasUtsDto: CreateUasUtsDto,
    @Req() req: any
  ) {
    const currentUser = req.user;
    const result = await this.examService.createExamUasUts(createUasUtsDto, currentUser);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'UAS/UTS Exam created successfully',
      data: result,
    };
  }

  // @Patch('publish')
  // @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  // async publishExam(
  //   @Query('examId') examId: number,
  //   @Req() req: any
  // ) {
  //   const currentUser = req.user;
  //   const updatedExam = await this.examService.publishExam(examId, currentUser);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Exam published successfully',
  //     data: updatedExam,
  //   };
  // }
}
