import * as ExcelJS from 'exceljs';
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Class } from 'src/class/entities/class.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async generateTemplateExcelCreateUser(response: Response, currentUser: any) {
    const executor = currentUser.fullName;

    this.logger.log(`[${executor}] [generateTemplateExcelCreateUser] Generating Excel template for creating users`);

    const workbook = new ExcelJS.Workbook();

    // Ambil data kelas dari tabel Class
    const classes = await this.classRepository.find({ where: { statusData: true } });

    if (classes.length === 0) {
      this.logger.warn(`[${executor}] [generateTemplateExcelCreateUser] No active classes found. Aborting Excel generation.`);
      response.status(404).send('No active classes found.');
      return;
    }

    classes.forEach(classEntity => {
      const worksheet = workbook.addWorksheet(classEntity.name);

      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Lengkap', key: 'namaLengkap', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Password', key: 'password', width: 20 },
        { header: 'No Hp', key: 'noHp', width: 20 },
      ];
    });

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=users-template.xlsx',
    );

    await workbook.xlsx.write(response);
    response.end();

    this.logger.log(`[${executor}] [generateTemplateExcelCreateUser] Excel template generated and sent successfully`);
  }
}
