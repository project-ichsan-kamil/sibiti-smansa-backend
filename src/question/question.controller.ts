import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  HttpStatus,
  Put,
  Query,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post('/create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: any) {
    const createdQuestion = await this.questionService.create(
      createQuestionDto,
      req.user,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Question successfully created',
      data: createdQuestion,
    };
  }

  @Patch()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async updateByExamIdAndQuestionNumber(
    @Query('examId') examId: number,
    @Query('questionNumber') questionNumber: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: any,
  ) {
    const updatedQuestion =
      await this.questionService.updateByExamIdAndQuestionNumber(
        examId,
        questionNumber,
        updateQuestionDto,
        req.user,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Question updated successfully',
      data: updatedQuestion,
    };
  }

  @Get('')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async getQuestionByExamIdAndQuestionNumber(
    @Query('examId') examId: number,
    @Query('questionNumber') questionNumber: number,
    @Req() req: any,
  ) {
    const question = await this.questionService.getQuestionByExamIdAndQuestionNumber(
      examId,
      questionNumber,
      req.user,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Question retrieved successfully',
      data: question,
    };
  }

  @Get('exam')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async getQuestionsByExamId(
      @Query('examId') examId: number,
      @Req() req: any,
  ) {
      const questions = await this.questionService.getQuestionsByExamId(examId, req.user);

      return {
          statusCode: HttpStatus.OK,
          message: 'Questions retrieved successfully',
          data: questions,
      };
  }
}
