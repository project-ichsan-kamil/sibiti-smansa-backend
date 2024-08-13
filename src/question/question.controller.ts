import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRoleEnum } from 'src/user-role/enum/user-role.enum';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post('/create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  async create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: any) {
    const createdQuestion = await this.questionService.create(createQuestionDto, req.user);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Question successfully created',
      data: createdQuestion,
    };
  }

  // @Get()
  // @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  // findAll(@Req() req: any) {
  //   return this.questionService.findAll(req.user);
  // }

  // @Get(':id')
  // @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  // findOne(@Param('id') id: number, @Req() req: any) {
  //   return this.questionService.findOne(id, req.user);
  // }

  // @Patch(':id')
  // @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  // update(@Param('id') id: number, @Body() updateQuestionDto: UpdateQuestionDto, @Req() req: any) {
  //   return this.questionService.update(id, updateQuestionDto, req.user);
  // }

  // @Delete(':id')
  // @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.GURU)
  // remove(@Param('id') id: number, @Req() req: any) {
  //   return this.questionService.remove(id, req.user);
  // }
}
