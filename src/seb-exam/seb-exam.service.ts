import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebExam } from './entities/seb-exam.entity';
import { randomInt } from 'crypto';  // Node.js module for generating random numbers
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SebExamService {
    private readonly logger = new Logger(SebExamService.name);  // Logger for this service

    constructor(
        @InjectRepository(SebExam)
        private readonly sebExamRepository: Repository<SebExam>,
    ) {}

    // Generate a random 6-digit number
    private generateRandomCode(): string {
        return randomInt(100000, 999999).toString();
    }

    // Create a new SebExam
    async createSebExam(examLink: string, name: string): Promise<SebExam> {
        const password = this.generateRandomCode();
        const exitCode = `exit${this.generateRandomCode()}`;

        const newSebExam = this.sebExamRepository.create({
            password,
            examLink,
            exitCode,
            name,  // Adding name to the new SebExam record
            statusData: true,
            createdBy: 'SYSTEM',
            updatedBy: 'SYSTEM',
        });

        try {
            const savedExam = await this.sebExamRepository.save(newSebExam);
            this.logger.log(`SebExam created with ID: ${savedExam.id}`);
            return savedExam;
        } catch (error) {
            this.logger.error('Error creating SebExam', error.stack);
            throw new Error('Error creating SebExam');
        }
    }

    // Start exam: Check if the password is correct and return the exam link
    async startExam(password: string): Promise<string> {
      const sebExam = await this.sebExamRepository.findOne({ where: { password } });
        if (!sebExam) {
          this.logger.warn('Invalid password attempt');
          throw new HttpException('Invalid password', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Exam started with ID: ${sebExam.id}`);
      return sebExam.examLink;
    }

    // Exit exam: Check if the exit code is correct
    async exitExam(exitCode: string): Promise<{ isExit: boolean }> {
            const sebExam = await this.sebExamRepository.findOne({ where: { exitCode } });

            if (!sebExam) {
                this.logger.warn('Invalid exit code attempt');
                throw new HttpException('Invalid exit code', HttpStatus.NOT_FOUND);
            }

            this.logger.log(`Exam exited with ID: ${sebExam.id}`);
            return {
                isExit: true,
            };
        } 

    async getAllActiveSebExams(): Promise<SebExam[]> {
        try {
            const activeExams = await this.sebExamRepository.find({
                where: { statusData: true },  // Filter only exams with statusData = true
                order: { name: 'ASC' },       // Sort by 'name' in ascending order
            });
    
            this.logger.log(`Found ${activeExams.length} active SebExams`);
            return activeExams;
        } catch (error) {
            this.logger.error('Error fetching active SebExams', error.stack);
            throw new HttpException('Error fetching active SebExams', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    

      // Cron job to update passwords every 5 minutes
      @Cron('0 */5 * * * *')
      async updateExamPasswords(): Promise<void> {
          try {
              const exams = await this.sebExamRepository.find();
              for (const exam of exams) {
                  const newPassword = this.generateRandomCode();
                  exam.password = newPassword;
                  exam.updatedBy = 'SYSTEM';
                  await this.sebExamRepository.save(exam);
                  this.logger.log(`Password updated for SebExam ID: ${exam.id}`);
              }
          } catch (error) {
              this.logger.error('Error updating passwords for exams', error.stack);
          }
      }
}
