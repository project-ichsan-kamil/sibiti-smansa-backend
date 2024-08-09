import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.auth.guard';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('generate-template-create-user')
  @UseGuards(JwtAuthGuard)
  async generateTemplate(@Res() response: Response, @Req() req ) {
    const currentUser = req.user
    await this.excelService.generateTemplateExcelCreateUser(response, currentUser);
  }
}
