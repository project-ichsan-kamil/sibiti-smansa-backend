import { Controller, Post, Body, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ParticipantAnswerService } from './participant-answer.service';
import { CreateParticipantAnswerDto } from './dto/create-participant-answer.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Controller('answer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipantAnswerController {
  constructor(private readonly answerService: ParticipantAnswerService) {}

  @Post('create')
  @Roles(UserRoleEnum.SISWA)
  async createAnswer(
    @Body(ValidationPipe) createAnswerDto: CreateParticipantAnswerDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    const result = await this.answerService.createAnswer(createAnswerDto, currentUser);
    return {
      statusCode: 201,
      message: 'Answer created successfully',
      data: result,
    };
  }
}
