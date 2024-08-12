import { Injectable } from '@nestjs/common';
import { CreateParticipantExamDto } from './dto/create-participant-exam.dto';
import { UpdateParticipantExamDto } from './dto/update-participant-exam.dto';

@Injectable()
export class ParticipantExamService {
  create(createParticipantExamDto: CreateParticipantExamDto) {
    return 'This action adds a new participantExam';
  }

  findAll() {
    return `This action returns all participantExam`;
  }

  findOne(id: number) {
    return `This action returns a #${id} participantExam`;
  }

  update(id: number, updateParticipantExamDto: UpdateParticipantExamDto) {
    return `This action updates a #${id} participantExam`;
  }

  remove(id: number) {
    return `This action removes a #${id} participantExam`;
  }
}
