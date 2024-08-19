import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { CreateParticipantAnswerDto } from './dto/create-participant-answer.dto';
import { Exam } from 'src/exam/entities/exam.entity';
import { Users } from 'src/users/entities/user.entity';
import { StatusAnswer } from './enum/status-answer.enum';
import { ParticipantType, StatusExam } from 'src/exam/enum/exam.enum';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';
import { UserClass } from 'src/class/entities/user-class.entity';
import { ECDH } from 'crypto';

@Injectable()
export class ParticipantAnswerService {
  private readonly logger = new Logger(ParticipantAnswerService.name);
  constructor(
    @InjectRepository(ParticipantAnswer)
    private participantAnswerRepository: Repository<ParticipantAnswer>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ParticipantExam)
    private participantExamRepository: Repository<ParticipantExam>,
    @InjectRepository(UserClass)
    private userClassRepository: Repository<UserClass>,
  ) {}

  async createAnswer(createAnswerDto: CreateParticipantAnswerDto, currentUser: any) {
    const executor = `[${currentUser.fullName}][createAnswer]`;
  
    this.logger.log(`${executor} Starting answer creation for exam ID: ${createAnswerDto.examId}`);
  
    const { examId, latitude, longitude } = createAnswerDto;
  
    // Jalankan operasi secara paralel
    const [exam, existingAnswer] = await Promise.all([
      this.examRepository.findOne({ where: { id: examId, statusData: true } }),
      this.participantAnswerRepository.findOne({ where: { user: { id: currentUser.id }, exam: { id: examId } } })
    ]);
  
    // 1. Check apakah ujian ada
    if (!exam) {
      this.logger.error(`${executor} Exam not found with ID: ${examId}`);
      throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
    }
  
    // 2. Check apakah ujiannya status publish
    if (exam.statusExam !== StatusExam.PUBLISH) {
      this.logger.error(`${executor} Exam with ID: ${examId} is not in PUBLISH status`);
      throw new HttpException('Exam is not published', HttpStatus.BAD_REQUEST);
    }
  
    // 3. Check jika jawaban sudah ada
    if (existingAnswer) {
      this.logger.log(`${executor} Existing answer found for exam ID: ${examId}, participant answer ID: ${existingAnswer.id}`);
      return existingAnswer;
    }
  
    // 4. Validasi apakah user berada di ujian atau kelas tersebut
    const isAuthorized = await this.validateStudentInExam(currentUser, exam);
    if (!isAuthorized) {
      this.logger.error(`${executor} User with ID: ${currentUser.id} is not authorized for the exam`);
      throw new HttpException('You are not authorized for this exam', HttpStatus.FORBIDDEN);
    }
  
    // 5. Simpan ke dalam database jika belum ada
    const randomQuestionNumber = this.generateRandomQuestionOrder(exam.sumQuestion, exam.randomize);
  
    const listAnswers = Array.from({ length: exam.sumQuestion }, (_, i) => ({
      no: i + 1,
      ans: "",
      hst: 0
    }));
  
    const participantAnswer = this.participantAnswerRepository.create({
      user: currentUser,
      exam,
      timeStarted: new Date(),
      randomQuestionNumber: JSON.stringify(randomQuestionNumber),
      listAnswers: JSON.stringify(listAnswers),
      latitude: latitude,
      longitude: longitude,
      status: StatusAnswer.IN_PROGRESS,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
    });
  
    const savedParticipantAnswer = await this.participantAnswerRepository.save(participantAnswer);
    this.logger.log(`${executor} Answer created successfully for exam ID: ${examId}, participant answer ID: ${savedParticipantAnswer.id}`);
  
    return savedParticipantAnswer;
  }
  
  private async validateStudentInExam(currentUser: Users, exam: Exam): Promise<boolean> {
    if (exam.participantType === ParticipantType.CLASS) {
      // Gabungkan validasi kelas dan ujian dalam satu query
      const participantClass = await this.participantExamRepository.findOne({
        where: {
          class: { userClasses: { user : { id : currentUser.id} } }, // Gabungkan validasi kelas dan pengguna
          exam: { id: exam.id },
          statusData: true,
        },
      });
  
      return !!participantClass;
    } else {
      // Validasi berdasarkan user partisipan di ujian
      const participantUser = await this.participantExamRepository.findOne({
        where: {
          user: { id: currentUser.id },
          exam: { id: exam.id },
          statusData: true,
        },
      });
  
      return !!participantUser;
    }
  }

  private generateRandomQuestionOrder(numQuestions: number, isRandomized: boolean): number[] {
    const order = Array.from({ length: numQuestions }, (_, i) => i + 1);
    
    if (isRandomized) {
      // Fisher-Yates Shuffle untuk pengacakan yang lebih cepat dan efisien
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
  
    return order;
  }
  
}
