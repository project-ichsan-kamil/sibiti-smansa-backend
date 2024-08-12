import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { CreateSubjectDto } from './dto/create-subject.dto';
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async findAll(@Req() req): Promise<any> {
    const result = await this.subjectService.findAll(req.user);
    return {
      statusCode: 200,
      message: 'Data berhasil ditemukan',
      count: result.length,
      data: result,
    }
  }
}
