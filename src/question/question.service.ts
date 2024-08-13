import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Exam } from '../exam/entities/exam.entity';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, currentUser: any): Promise<void> {
    const { examId } = createQuestionDto;
    const executor = `[${currentUser.fullName}][createQuestion]`;

    // Check if the exam exists and is active
    const exam = await this.examRepository.findOne({ where: { id: examId, statusData: true } });
    if (!exam) {
      this.logger.error(`${executor} Exam not found or inactive`);
      throw new HttpException('Exam not found or inactive', HttpStatus.BAD_REQUEST);
    }

    // If the submitter is a Guru, check if they are the submitter of the exam
    if (currentUser.role === 'GURU' && currentUser.id !== exam.submitter.id) {
      this.logger.error(`${executor} Unauthorized submitter attempt`);
      throw new HttpException('You are not authorized to submit questions for this exam', HttpStatus.FORBIDDEN);
    }

    // Check if at least one question already exists for this exam
    const existingQuestion = await this.questionRepository.findOne({
      where: { exam: { id: examId }, statusData: true },
    });

    if (existingQuestion) {
      this.logger.log(`${executor} Questions already exist for this exam, skipping creation.`);
      return;
    }

    // Generate empty questions based on the sumQuestion and sumOption
    for (let i = 1; i <= exam.sumQuestion; i++) {
      const question = this.questionRepository.create({
        exam,
        questionNumber: i,
        createdBy: currentUser.fullName,
        updatedBy: currentUser.fullName,
        A: exam.sumOption >= 1 ? '' : null,
        B: exam.sumOption >= 2 ? '' : null,
        C: exam.sumOption >= 3 ? '' : null,
        D: exam.sumOption >= 4 ? '' : null,
        E: exam.sumOption >= 5 ? '' : null,
        F: exam.sumOption >= 6 ? '' : null,
      });

      await this.questionRepository.save(question);
    }

    this.logger.log(`${executor} Questions generated successfully for exam ${exam.name}`);
  }

  async findOne(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id, statusData: true } });
    if (!question) {
      this.logger.error(`Question with ID ${id} not found`);
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }
    return question;
  }

  async update(id: number, updateQuestionDto: Partial<Question>, currentUser: any): Promise<Question> {
    const executor = `[${currentUser.fullName}][updateQuestion]`;

    const question = await this.findOne(id);
    if (!question) {
      this.logger.error(`${executor} Question with ID ${id} not found`);
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    const updatedQuestion = this.questionRepository.merge(question, {
      ...updateQuestionDto,
      updatedBy: currentUser.fullName,
    });

    return await this.questionRepository.save(updatedQuestion);
  }

  async remove(id: number, currentUser: any): Promise<void> {
    const executor = `[${currentUser.fullName}][removeQuestion]`;

    const question = await this.findOne(id);
    if (!question) {
      this.logger.error(`${executor} Question with ID ${id} not found`);
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    question.statusData = false;
    question.updatedBy = currentUser.fullName;

    await this.questionRepository.save(question);
    this.logger.log(`${executor} Question with ID ${id} has been deactivated`);
  }
}
