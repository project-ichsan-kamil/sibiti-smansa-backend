import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Setting } from 'src/settings/entities/setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

    constructor(
        @InjectRepository(Setting)
        private readonly settingsRepository: Repository<Setting>,
    ) {
        this.initializeTransporter();
    }

    private async initializeTransporter() {
        const emailSetting = await this.settingsRepository.findOne({ where: { key: 'EMAIL_USER' } });
        const passwordSetting = await this.settingsRepository.findOne({ where: { key: 'EMAIL_PASS' } });

        if (!emailSetting || !passwordSetting) {
            throw new HttpException('Email settings not found', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailSetting.value,  // Fetch email from the database
                pass: passwordSetting.value, // Fetch password from the database
            },
        });
    }

    public async sendPassword(email: string, password: string): Promise<void> {
      const subject = 'Selamat Datang! Akses Akun Anda di Web CBT SMA 1 Payakumbuh';
      const BASE_URL = await this.settingsRepository.findOne({ where: { key: 'BASE_URL' } });

      const html = `
          <p>Pengguna Yang Terhormat,</p>
          <p>Terima kasih telah mendaftar bersama kami! Anda sekarang dapat mengakses akun Anda dengan mengklik tautan di bawah ini:</p>
          <p><a href="${BASE_URL.value}">${BASE_URL.value}</a></p>
          <p>Silakan masuk menggunakan kredensial berikut:</p>
          <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Kata Sandi:</strong> ${password}</li>
          </ul>
          <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim kami.</p>
          <br />
          <footer style="font-size: 12px; color: #555;">
              <p>Salam Hormat,</p>
              <p>SMA 1 PAYAKUMBUH</p>
          </footer>
      `;
      
      await this.sendEmail(email, subject, html);
  }


  public async resetPassword(email: string, resetLink: string): Promise<void> {
    const subject = 'Reset Password';
    const html = `<p>Untuk mengatur ulang password Anda, silakan klik tautan berikut: <a href="${resetLink}">Reset Password</a></p>`;
    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: 'fajruluchsan0208@gmail.com',
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} successfully.`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`, error.stack); 
      throw new HttpException(
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
