import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { count } from 'console';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const result = await this.subjectService.getAllSubjects();
    return {
      statusCode: 200,
      message: 'Data berhasil diambil',
      count: result.length,
      data: result,
    };
  }
}
