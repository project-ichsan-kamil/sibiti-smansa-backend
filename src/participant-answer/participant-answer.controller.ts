import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParticipantAnswerService } from './participant-answer.service';
import { CreateParticipantAnswerDto } from './dto/create-participant-answer.dto';
import { UpdateParticipantAnswerDto } from './dto/update-participant-answer.dto';

@Controller('participant-answer')
export class ParticipantAnswerController {
  constructor(private readonly participantAnswerService: ParticipantAnswerService) {}

  @Post()
  create(@Body() createParticipantAnswerDto: CreateParticipantAnswerDto) {
    return this.participantAnswerService.create(createParticipantAnswerDto);
  }

  @Get()
  findAll() {
    return this.participantAnswerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantAnswerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParticipantAnswerDto: UpdateParticipantAnswerDto) {
    return this.participantAnswerService.update(+id, updateParticipantAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.participantAnswerService.remove(+id);
  }
}
