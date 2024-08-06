import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Subject } from './entities/subject.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { CreateSubjectDto } from './dto/create-subject.dto';
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  create(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<any> {
    const result = await this.subjectService.findAll();
    return {
      statusCode: 200,
      message: 'Data berhasil ditemukan',
      count: result.length,
      data: result,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: number): Promise<Subject> {
    return this.subjectService.findOne(id);
  }

  @Get('search/:name')
  @UseGuards(JwtAuthGuard)
  findByName(@Param('name') name: string): Promise<Subject[]> {
    return this.subjectService.findByName(name);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  update(@Param('id') id: number, @Body() updateSubjectDto: { name: string; description: string; updatedBy: string }): Promise<Subject> {
    return this.subjectService.update(id, updateSubjectDto.name, updateSubjectDto.description, updateSubjectDto.updatedBy);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number): Promise<void> {
    return this.subjectService.remove(id);
  }
}
