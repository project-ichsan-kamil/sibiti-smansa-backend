import { Controller, Post, Body, HttpException, HttpStatus, ValidationPipe, UsePipes } from '@nestjs/common';
import { SebExamService } from './seb-exam.service';
import { ExitExamDto } from './dto/exit-seb-exam.dto';
import { StartExamDto } from './dto/start-seb-exam.dto';

@Controller('seb-exam')
export class SebExamController {
    constructor(private readonly sebExamService: SebExamService) {}

    // API endpoint to create a new SebExam with 'name' and 'examLink'
    @Post('create')
    async createSebExam(@Body() body: { examLink: string, name: string }) {
        try {
            const { examLink, name } = body;
            const newExam = await this.sebExamService.createSebExam(examLink, name);
            return {
                message: 'SebExam created successfully',
                data: newExam,
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // API endpoint to start the exam by verifying the password
    @Post('start')
    @UsePipes(ValidationPipe)
    async startExam(@Body() startExamDto: StartExamDto) {
      const { password } = startExamDto;
      const result = await this.sebExamService.startExam(password);
      return {
        statusCode: HttpStatus.OK,
        message: 'Start exam successfully',
        link: result,
      };
    }

    // API endpoint to exit the exam by verifying the exit code
    @Post('exit')
    @UsePipes(ValidationPipe)
    async exitExam(@Body() exitExamDto: ExitExamDto) {
      const { exitCode } = exitExamDto;
      const result = await this.sebExamService.exitExam(exitCode);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'Exit successfully',
        data: result,
      };
    }

}
