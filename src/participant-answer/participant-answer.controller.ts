import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  ValidationPipe,
  Patch,
  UsePipes,
  Get,
  Query,
} from '@nestjs/common';
import { ParticipantAnswerService } from './participant-answer.service';
import { CreateParticipantAnswerDto } from './dto/create-participant-answer.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';
import { UpdateParticipantAnswerDto } from './dto/update-participant-answer.dto';
import { CompleteExamDto } from './dto/complete-answer.dto';

@Controller('answer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipantAnswerController {
  constructor(private readonly answerService: ParticipantAnswerService) {}

  @Post('create')
  @Roles(UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async createAnswer(
    @Body(ValidationPipe) createAnswerDto: CreateParticipantAnswerDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.answerService.createAnswer(
      createAnswerDto,
      currentUser,
    );
    return {
      statusCode: 201,
      message: 'Answer created successfully',
      data: result,
    };
  }

  @Patch('update-answer')
  @Roles(UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async updateAnswer(
    @Body() updatePartisipantAnswerDto: UpdateParticipantAnswerDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.answerService.updateAnswer(
      updatePartisipantAnswerDto,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'Answer updated successfully',
      data: result,
    };
  }

  @Post('complete')
  @Roles(UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async completeExam(
    @Body() completeExamDto: CompleteExamDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.answerService.completeExam(
      completeExamDto.examId,
      currentUser,
    );
    return {
      statusCode: 200,
      message: 'Exam completed successfully',
      data: result,
    };
  }

  @Get('score')
  @Roles(UserRoleEnum.SISWA)
  @UsePipes(ValidationPipe)
  async getCoreExam(
    @Query('examId') examId: number,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.answerService.getScoreExam(examId, currentUser);
    
    return {
      statusCode: 200,
      message: 'Score exam data retrieved successfully',
      data: result,
    };
  }
}
