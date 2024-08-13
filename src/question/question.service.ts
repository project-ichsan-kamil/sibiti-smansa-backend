import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Exam } from '../exam/entities/exam.entity';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, currentUser: any): Promise<void> {   //TODO: if case subbmiter multiple
    const { examId } = createQuestionDto;
    const executor = `[${currentUser.fullName}][createQuestion]`;

    // Check if the exam exists and is active
    const exam = await this.examRepository.findOne({ where: { id: examId, statusData: true } });
    if (!exam) {
      this.logger.error(`${executor} Exam not found or inactive`);
      throw new HttpException('Exam not found or inactive', HttpStatus.BAD_REQUEST);
    }

    // If the submitter is a Guru, check if they are the submitter of the exam
    if (currentUser.role === UserRoleEnum.GURU && currentUser.id !== exam.submitter.id) {
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

  async updateByExamIdAndQuestionNumber(      //TODO: if case subbmiter multiple
    examId: number,
    questionNumber: number,
    updateQuestionDto: Partial<Question>,
    currentUser: any,
  ): Promise<Question> {
    const executor = `[${currentUser.fullName}][updateQuestionByExamIdAndQuestionNumber]`;

    // Check if the exam exists and is active
    const exam = await this.examRepository.findOne({ where: { id: examId, statusData: true } });
    if (!exam) {
      this.logger.error(`${executor} Exam with ID ${examId} not found or inactive`);
      throw new HttpException('Exam not found or inactive', HttpStatus.BAD_REQUEST);
    }

    // Check if the user is allowed to update the question
    if (
      currentUser.role === UserRoleEnum.GURU &&
      currentUser.id !== exam.submitter.id
    ) {
      this.logger.error(`${executor} Unauthorized update attempt by non-submitter Guru`);
      throw new HttpException('You are not authorized to update questions for this exam', HttpStatus.FORBIDDEN);
    }

    // Find the question by examId and questionNumber
    const question = await this.questionRepository.findOne({
      where: { exam: { id: examId }, questionNumber: questionNumber, statusData: true },
    });

    if (!question) {
      this.logger.error(`${executor} Question with examId ${examId} and questionNumber ${questionNumber} not found`);
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    // Update the question with new data
    const updatedQuestion = this.questionRepository.merge(question, {
      ...updateQuestionDto,
      updatedBy: currentUser.fullName,
    });

    await this.questionRepository.save(updatedQuestion);
    this.logger.log(`${executor} Question ${questionNumber} for exam ${exam.name} updated successfully`);

    return updatedQuestion;
  }

  async getQuestionByExamIdAndQuestionNumber(       //TODO: if submiter multiple
    examId: number,
    questionNumber: number,
    currentUser: any,
  ): Promise<Question> {
    const executor = `[${currentUser.fullName}][getQuestionByExamIdAndQuestionNumber]`;

    // Check if the exam exists and is active
    const exam = await this.examRepository.findOne({
      where: { id: examId, statusData: true },
    });
    if (!exam) {
      this.logger.error(`${executor} Exam with ID ${examId} not found or inactive`);
      throw new HttpException('Exam not found or inactive', HttpStatus.BAD_REQUEST);
    }

    // Check if the user is allowed to view the question
    if (
      currentUser.role === 'GURU' &&
      currentUser.id !== exam.submitter.id
    ) {
      this.logger.error(`${executor} Unauthorized access attempt by non-submitter Guru`);
      throw new HttpException('You are not authorized to view questions for this exam', HttpStatus.FORBIDDEN);
    }

    // Find the question by examId and questionNumber
    const question = await this.questionRepository.findOne({
      where: { exam: { id: examId }, questionNumber: questionNumber, statusData: true },
    });

    if (!question) {
      this.logger.error(`${executor} Question with examId ${examId} and questionNumber ${questionNumber} not found`);
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    this.logger.log(`${executor} Retrieved question ${questionNumber} for exam ${exam.name} successfully`);
    return question;
  }

}
