


import { Controller, Post, Body, Req, UsePipes, ValidationPipe, Get, Param } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { Exam } from './entities/exam.entity';

@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('create')
  @UsePipes(ValidationPipe)
  async createExam(@Body() createExamDto: CreateExamDto, @Req() req): Promise<Exam> {
    const currentUser = req.user;
    return await this.examService.create(createExamDto, currentUser);
  }

  // Other endpoints (GET, PUT, DELETE, etc.) can be added here
}

