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
import { UpdateParticipantAnswerDto } from './dto/update-participant-answer.dto';
import { Question } from 'src/question/entities/question.entity';

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
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(UserClass)
    private userClassRepository: Repository<UserClass>,
  ) {}

  async createAnswer(examId: number, currentUser: any) {    
    const executor = `[${currentUser.fullName}][createAnswer]`;
    
    this.logger.log(`${executor} Starting answer creation for exam ID: ${examId}`);
    
  
    // Parallel operations to fetch exam and existing answer
    const [exam, existingAnswer] = await Promise.all([
      this.examRepository.findOne({ where: { id: examId, statusData: true } }),
      this.participantAnswerRepository.findOne({ where: { user: { id: currentUser.id }, exam: { id: examId } } })
    ]);
  
    // Check if the exam exists
    if (!exam) {
      this.logger.error(`${executor} Exam not found with ID: ${examId}`);
      throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
    }
  
    // Check if the exam is in PUBLISH status
    if (exam.statusExam !== StatusExam.PUBLISH) {
      this.logger.error(`${executor} Exam with ID: ${examId} is not in PUBLISH status`);
      throw new HttpException('Exam is not published', HttpStatus.BAD_REQUEST);
    }
  
    // Check if an answer already exists for this user and exam
    if (existingAnswer) {
      this.logger.log(`${executor} Existing answer found for exam ID: ${examId}, participant answer ID: ${existingAnswer.id}`);
      return existingAnswer;
    }
  
    // Check eligibility
    const isEligible = await this.isEligibleForExam(exam, currentUser);
    if (!isEligible) {
      this.logger.error(`${executor} User with ID: ${currentUser.id} is not eligible for the exam`);
      throw new HttpException('You are not authorized for this exam', HttpStatus.FORBIDDEN);
    }
  
    // Generate a random question order if eligible
    const randomQuestionNumber = this.generateRandomQuestionOrder(exam.sumQuestion, exam.randomize);
  
    // Create answer template
    const listAnswers = Array.from({ length: exam.sumQuestion }, (_, i) => ({
      no: i + 1,
      ans: "",
      hst: 0
    }));
  
    // Create and save the participant answer
    const participantAnswer = this.participantAnswerRepository.create({
      user: currentUser,
      exam,
      timeStarted: new Date(),
      randomQuestionNumber: JSON.stringify(randomQuestionNumber),
      listAnswers: JSON.stringify(listAnswers),
      status: StatusAnswer.IN_PROGRESS,
      createdBy: currentUser.fullName,
      updatedBy: currentUser.fullName,
    });
  
    const savedParticipantAnswer = await this.participantAnswerRepository.save(participantAnswer);
    this.logger.log(`${executor} Answer created successfully for exam ID: ${examId}, participant answer ID: ${savedParticipantAnswer.id}`);
  
    return savedParticipantAnswer;
  }
  

  async updateAnswer(updateAnswerDto: UpdateParticipantAnswerDto, currentUser: any) {
    const { examId, no, ans, hst } = updateAnswerDto;
    const executor = `[${currentUser.fullName}][updateAnswer]`;
  
    this.logger.log(`${executor} Starting to update answer for examId: ${examId}, question number: ${no}`);
  
    // 1. Fetch both participant answer and question data in parallel
    const [participantAnswer, question] = await Promise.all([
      this.participantAnswerRepository.findOne({
        where: { user: { id: currentUser.id }, exam: { id: examId } },
      }),
      !hst ? this.questionRepository.findOne({
        where: { exam: { id: examId }, questionNumber: no, statusData: true },
      }) : null,  // Only fetch the question if the user is sure about their answer
    ]);
  
    // Check for participantAnswer existence
    if (!participantAnswer) {
      this.logger.error(`${executor} Access denied or the exam hasn't started for examId: ${examId}`);
      throw new HttpException('Access denied or the exam hasn\'t started', HttpStatus.FORBIDDEN);
    }
    
    // 2. Parse listAnswers and correctAnswers from participant answer
    let listAnswers = JSON.parse(participantAnswer.listAnswers);
    let correctAnswers = JSON.parse(participantAnswer.listCorrectAnswer) || [];
  
    // 3. Find and update the specific answer in listAnswers
    const answerToUpdate = listAnswers.find(answer => answer.no === no);
    
    if (!answerToUpdate) {
      this.logger.error(`${executor} Question number ${no} not found in examId: ${examId}`);
      throw new HttpException(`Question number ${no} not found`, HttpStatus.NOT_FOUND);
    }
    
    // Update the answer and its status
    answerToUpdate.ans = ans;
    answerToUpdate.hst = hst;
  
    // 4. If the user is sure about the answer (hst = false), check the correctness
    if (!hst) {
      if (!question) {
        this.logger.error(`${executor} Question with number ${no} not found in examId: ${examId}`);
        throw new HttpException(`Question with number ${no} not found`, HttpStatus.NOT_FOUND);
      }
  
      const isCorrect = question.key === ans;
  
      if (isCorrect) {
        this.logger.log(`${executor} The answer for question ${no} is correct.`);
        // Add to correctAnswers if it doesn't already exist
        if (!correctAnswers.includes(no)) {
          correctAnswers.push(no);
        }
      } else {
        this.logger.log(`${executor} The answer for question ${no} is incorrect.`);
        // Remove from correctAnswers if it exists
        correctAnswers = correctAnswers.filter(answerNo => answerNo !== no);
      }
    } else {
      this.logger.log(`${executor} The user is unsure about the answer for question ${no}, skipping correctness check.`);
    }
  
    // 5. Save the updated participant answer data
    participantAnswer.listAnswers = JSON.stringify(listAnswers);
    participantAnswer.listCorrectAnswer = JSON.stringify(correctAnswers);
  
    await this.participantAnswerRepository.save(participantAnswer);
  
    this.logger.log(`${executor} Answer for question ${no} successfully updated for examId: ${examId}`);
  
    // 6. Return success response
    return participantAnswer;
  }

  async completeExam(examId: number, currentUser: any) {
    const executor = `[${currentUser.fullName}][completeExam]`;
    const start = Date.now()
    this.logger.log(`${executor} Starting the exam completion process for examId: ${examId}`);
  
    // 1. Check if participant answer data exists for the user and exam
    const participantAnswer = await this.participantAnswerRepository.findOne({
      where: {
        user: { id: currentUser.id },
        exam: { id: examId },
      },
    });
  
    if (!participantAnswer) {
      this.logger.error(`${executor} Participant data not found for examId: ${examId}`);
      throw new HttpException('Participant data not found', HttpStatus.NOT_FOUND);
    }
  
    // 3. Calculate the score (correct answers / total questions * 100)
    const listAnswers = JSON.parse(participantAnswer.listAnswers);
    const totalQuestions = listAnswers.length;
    const correctAnswers = JSON.parse(participantAnswer.listCorrectAnswer).length;
    const score = (correctAnswers / totalQuestions) * 100;
  
    this.logger.log(`${executor} Calculated score: ${score}`);
  
    // 4. Update status to "complete"
    participantAnswer.status = StatusAnswer.COMPLETED;
    participantAnswer.score = score;
    await this.participantAnswerRepository.save(participantAnswer);
  
    this.logger.log(`${executor} Exam marked as complete for examId: ${examId}, score: ${score}`);
    
    // 5. Return the result
    return participantAnswer;
  } 

  async getScoreExam(examId: number, currentUser: any) {
    const executor = `[${currentUser.fullName}][getScoreExam]`;
    const start = Date.now();
    
    this.logger.log(`${executor} Starting the process to retrieve score for examId: ${examId}`);
    
    // 1. Retrieve both exam and participant data in parallel
    const [exam, participantAnswer] = await Promise.all([
      this.examRepository.findOne({ where: { id: examId, statusData: true } }),
      this.participantAnswerRepository.findOne({
        where: {
          user: { id: currentUser.id },
          exam: { id: examId },
          statusData: true
        },
      })
    ]);
  
    // 2. Validate both exam and participant data
    if (!exam) {
      this.logger.error(`${executor} Exam data not found for examId: ${examId}`);
      throw new HttpException('Exam data not found', HttpStatus.NOT_FOUND);
    }
  
    if (!participantAnswer) {
      this.logger.error(`${executor} Participant data not found for examId: ${examId} and userId: ${currentUser.id}`);
      throw new HttpException('Participant data not found', HttpStatus.NOT_FOUND);
    }
  
    const passingGrade = exam.passingGrade;
    const score = participantAnswer.score;
    
    // 3. Check if the participant has passed the exam
    const hasPassed = score >= passingGrade;
    this.logger.log(`${executor} Participant has ${hasPassed ? 'passed' : 'not passed'} the exam with score: ${score}`);
    
    const finish = Date.now();
    const executionTime = finish - start;
    this.logger.log(`${executor} Process completed. Execution time: ${executionTime} ms`);
    
    // 4. Return the result
    return {
      message: hasPassed ? 'Lolos passing grade' : 'Tidak lolos passing grade',
      score: score,
      passingGrade: passingGrade,
      status: hasPassed ? 'Passed' : 'Not Passed',
    };
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

 
  // Helper function to get all classes the user belongs to
  private async getUserClassIds(userId: number) {
    const userClasses = await this.userClassRepository.query(
      `SELECT classEntityId FROM user_class WHERE userId = ? AND statusData = true`, 
      [userId]
    );
  
    return userClasses.map((userClass) => userClass.classEntityId);
  }

  private async isEligibleForExam(exam: any, currentUser: any): Promise<boolean> {
    // Check participant type and validate eligibility
    if (exam.participantType === ParticipantType.CLASS) {
      const userClassIds = await this.getUserClassIds(currentUser.id);
      const participantClasses = await this.participantExamRepository.query(
        `SELECT classId FROM participant_exam WHERE examId = ? AND statusData = true`, 
        [exam.id]
      );
  
      const participantClassIds = participantClasses.map((p) => p.classId);
      return userClassIds.some((classId) => participantClassIds.includes(classId));
    } else if (exam.participantType === ParticipantType.USER) {
      const participantUser = await this.participantExamRepository.query(
        `SELECT * FROM participant_exam WHERE userId = ? AND examId = ? AND statusData = true`, 
        [currentUser.id, exam.id]
      );
  
      return participantUser.length > 0;
    }
    return false;
  }
  
  
}
