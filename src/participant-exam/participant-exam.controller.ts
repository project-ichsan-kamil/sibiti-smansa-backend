import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParticipantExamService } from './participant-exam.service';
import { CreateParticipantExamDto } from './dto/create-participant-exam.dto';
import { UpdateParticipantExamDto } from './dto/update-participant-exam.dto';

@Controller('participant-exam')
export class ParticipantExamController {
  constructor(private readonly participantExamService: ParticipantExamService) {}

  @Post()
  create(@Body() createParticipantExamDto: CreateParticipantExamDto) {
    return this.participantExamService.create(createParticipantExamDto);
  }

  @Get()
  findAll() {
    return this.participantExamService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantExamService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParticipantExamDto: UpdateParticipantExamDto) {
    return this.participantExamService.update(+id, updateParticipantExamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.participantExamService.remove(+id);
  }
}
