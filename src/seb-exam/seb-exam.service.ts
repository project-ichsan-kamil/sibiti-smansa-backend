import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SebExam } from './entities/seb-exam.entity';
import { randomInt } from 'crypto';  // Node.js module for generating random numbers

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
}
