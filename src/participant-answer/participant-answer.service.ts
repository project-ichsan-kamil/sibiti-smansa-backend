import { Injectable } from '@nestjs/common';
import { CreateParticipantAnswerDto } from './dto/create-participant-answer.dto';
import { UpdateParticipantAnswerDto } from './dto/update-participant-answer.dto';

@Injectable()
export class ParticipantAnswerService {
  create(createParticipantAnswerDto: CreateParticipantAnswerDto) {
    return 'This action adds a new participantAnswer';
  }

  findAll() {
    return `This action returns all participantAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} participantAnswer`;
  }

  update(id: number, updateParticipantAnswerDto: UpdateParticipantAnswerDto) {
    return `This action updates a #${id} participantAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} participantAnswer`;
  }
}
