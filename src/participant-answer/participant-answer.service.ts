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
  
    // 1. Check apakah ujian ada
    const exam = await this.examRepository.findOne({ where: { id: examId, statusData: true } });
    if (!exam) {
      this.logger.error(`${executor} Exam not found with ID: ${examId}`);
      throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
    }
  
    // 2. Check apakah ujiannya status publish
    if (exam.statusExam !== StatusExam.PUBLISH) {
      this.logger.error(`${executor} Exam with ID: ${examId} is not in PUBLISH status`);
      throw new HttpException('Exam is not published', HttpStatus.BAD_REQUEST);
    }
  
    // 3. Check if an answer already exists for the user and exam
    const existingAnswer = await this.participantAnswerRepository.findOne({
      where: {
        user: { id : currentUser.id},
        exam: { id : examId},
      },
    });
  
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
  
    const listAnswers = [];
    for (let i = 1; i <= exam.sumQuestion; i++) {
      listAnswers.push({
        no: i,        // No soal yang berurutan
        ans: "",          // Jawaban kosong awal
        hst: 0        // Belum terjawab
      });
    }
  
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
      // Validasi berdasarkan kelas
      const userClass = await this.userClassRepository.findOne({
        where: {
          user: { id: currentUser.id },
          statusData: true, 
        },
        relations: ['classEntity']
      });

      console.log(userClass);
      
  
      if (!userClass) {
        return false; // User tidak terdaftar di kelas manapun
      }

      const participantClass = await this.participantExamRepository.findOne({
        where: {
          class: { id : userClass.classEntity.id}, // Pastikan 'classEntityId' adalah ID kelas yang sesuai.
          exam : { id : exam.id },
          statusData: true,
        },
      });
  
      return !!participantClass; // Mengembalikan true jika user valid dalam kelas untuk ujian ini
  
    } else {
      // Validasi berdasarkan user partisipan di ujian
      const participantUser = await this.participantExamRepository.findOne({
        where: {
          user: { id : currentUser.id},
          exam: { id : exam.id},
          statusData: true, // hanya validasi data yang aktif
        },
      });
  
      return !!participantUser; // Mengembalikan true jika user valid sebagai partisipan untuk ujian ini
    }
  }

  private generateRandomQuestionOrder(numQuestions: number, isRandomized: boolean): number[] {
    const order = [...Array(numQuestions).keys()].map(i => i + 1);
    if (isRandomized) {
      return order.sort(() => Math.random() - 0.5); // Acak
    }
    return order; // Berurutan
  }
}
