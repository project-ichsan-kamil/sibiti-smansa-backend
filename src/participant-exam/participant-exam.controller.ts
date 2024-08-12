import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParticipantExamService } from './participant-exam.service';
import { CreateParticipantExamDto } from './dto/create-participant-exam.dto';
import { UpdateParticipantExamDto } from './dto/update-participant-exam.dto';

@Controller('participant-exam')
export class ParticipantExamController {
  constructor(private readonly participantExamService: ParticipantExamService) {}


}
