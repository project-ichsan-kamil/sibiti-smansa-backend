import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  ValidationPipe,
  HttpStatus,
  Patch,
  Query,
  Get,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateQuizDailyExamDto } from './dto/create-quiz-daily-exam.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { CreateUasUtsDto } from './dto/create-uas-uts-exam.dto';
import { BaseEditExamDto } from './dto/base-edit-exam.dto';

@Controller('exam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('create-quiz-daily-exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async createExamQuisAndUH(
    @Body(ValidationPipe) createQuisDailyExamDto: CreateQuizDailyExamDto,
    @Req() req: any,
  ) {
    
    const currentUser = req.user;
    const result = await this.examService.createExamQuisAndUH(
      createQuisDailyExamDto,
      currentUser,
    );
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
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.examService.createExamUasUts(
      createUasUtsDto,
      currentUser,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'UAS/UTS Exam created successfully',
      data: result,
    };
  }

  // Endpoint untuk mengedit Quiz atau Daily Exam
  @Patch('edit-quiz-daily-exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async editExamQuisAndUH(
    @Body(ValidationPipe) baseEditExamDto: BaseEditExamDto, // Gunakan DTO yang sesuai untuk edit
    @Req() req: any,
    @Query('examId') examId: number,
  ) {
    const currentUser = req.user;
    const result = await this.examService.editExamQuisAndUH(
      baseEditExamDto,
      examId,
      currentUser,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Quiz/Daily Exam edited successfully',
      data: result,
    };
  }

  // Endpoint untuk mengedit UAS/UTS Exam
  @Patch('edit-uas-uts-exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async editExamUasUts(
    @Body(ValidationPipe) baseEditExamDto: BaseEditExamDto, // Gunakan DTO yang sesuai untuk edit
    @Req() req: any,
    @Query('examId') examId: number,
  ) {
    const currentUser = req.user;
    const result = await this.examService.editExamUasUts(
      baseEditExamDto,
      examId,
      currentUser,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'UAS/UTS Exam edited successfully',
      data: result,
    };
  }

  @Patch('publish/quiz-uh')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async publishQuizUh(@Query('examId') examId: number, @Req() req: any) {
    const currentUser = req.user;
    const result = await this.examService.publishExam(
      examId,
      currentUser,
      'QUIZ_UH',
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Quiz/UH exam has been successfully published.`,
      data: result,
    };
  }

  @Patch('publish/uts-uas')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async publishUtsUas(@Query('examId') examId: number, @Req() req: any) {
    const currentUser = req.user;
    const result = await this.examService.publishExam(
      examId,
      currentUser,
      'UTS_UAS',
    );
    return {
      statusCode: HttpStatus.OK,
      message: `UTS/UAS exam has been successfully published.`,
      data: result,
    };
  }

  @Get()
  @Roles(UserRoleEnum.GURU, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  async getExams(@Query() query: any, @Req() req: any) {
    const currentUser = req.user; // Dapatkan user dari request
    const exams = await this.examService.getExamData(query, currentUser);
    return {
      statusCode: HttpStatus.OK,
      message: "Data ujian berhasil diambil",
      data: exams,
    };
  }

  @Get('get-by')
  @Roles(UserRoleEnum.GURU, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  async getExamById(@Query('id') id: number, @Req() req: any) {
    const currentUser = req.user; 
      const examData = await this.examService.getExamById(id, currentUser);
      return {
        statusCode: HttpStatus.OK,
        message: 'Data ujian berhasil diambil',
        data: examData,
      };
  }
}
