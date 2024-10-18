// import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class EmailService {
//   private transporter: nodemailer.Transporter; // Langsung inisialisasi transporter
//   private readonly logger = new Logger(EmailService.name);

//   // Hardcode kredensial email
//   private readonly emailUser = 'smapayakumbuh1@gmail.com'; // Ganti dengan email Anda
//   private readonly emailPass = 'rlzc ubtg oqaw ygvl'; // Ganti dengan password Anda  

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port: 465,
//       secure: true,
//       auth: {
//         user: this.emailUser,
//         pass: this.emailPass,
//       },
//       logger: true, 
//       debug: true, 
//     });
    
//   }

//   public async sendPassword(email: string, password: string): Promise<void> {
//     const subject = 'Selamat Datang! Akses Akun Anda di Web CBT SMA 1 Payakumbuh';
//     const BASE_URL = 'http://sibiti-smansa-prodlike.my.id'; 

//     const html = `
//       <p>Pengguna Yang Terhormat,</p>
//       <p>Terima kasih telah mendaftar bersama kami! Anda sekarang dapat mengakses akun Anda dengan mengklik tautan di bawah ini:</p>
//       <p><a href="${BASE_URL}">${BASE_URL}</a></p>
//       <p>Silakan masuk menggunakan kredensial berikut:</p>
//       <ul>
//           <li><strong>Email:</strong> ${email}</li>
//           <li><strong>Kata Sandi:</strong> ${password}</li>
//       </ul>
//       <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim kami.</p>
//       <br />
//       <footer style="font-size: 12px; color: #555;">
//           <p>Salam Hormat,</p>
//           <p>SMA 1 PAYAKUMBUH</p>
//       </footer>
//     `;

//     await this.sendEmail(email, subject, html);
//   }

//   public async resetPassword(email: string, resetLink: string): Promise<void> {
//     const subject = 'Permintaan Reset Password';
//     const html = `
//       <p>Pengguna Yang Terhormat,</p>
//       <p>Kami menerima permintaan untuk mengatur ulang password Anda. Untuk melanjutkan, silakan klik tautan di bawah ini:</p>
//       <p><a href="${resetLink}">${resetLink}</a></p>
//       <p>Jika Anda tidak meminta untuk mengatur ulang password, Anda dapat mengabaikan email ini.</p>
//       <p>Jika Anda mengalami kesulitan, jangan ragu untuk menghubungi tim dukungan kami.</p>
//       <br />
//       <footer style="font-size: 12px; color: #555;">
//           <p>Salam Hormat,</p>
//           <p>SMA 1 PAYAKUMBUH</p>
//       </footer>
//     `;

//     await this.sendEmail(email, subject, html);
//   }

//   private async sendEmail(
//     to: string,
//     subject: string,
//     html: string,
//   ): Promise<void> {
//     const mailOptions = {
//       from: this.emailUser,
//       to,
//       subject,
//       html,
//     };

//     try {
//       await this.transporter.sendMail(mailOptions);
//       this.logger.log(`Email sent to ${to} successfully.`);
//     } catch (error) {
//       this.logger.error(`Error sending email to ${to}: ${error.message}`, error.stack);
//       throw new HttpException(
//         'Failed to send email',
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }
// }


import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from 'src/settings/entities/setting.entity';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {}

  private async initializeTransporter(): Promise<void> {
    // Fetch email credentials from the database
    const emailUser = await this.settingsRepository.findOne({ where: { key: 'EMAIL_USER' } });
    const emailPass = await this.settingsRepository.findOne({ where: { key: 'EMAIL_PASS' } });

    // Create the transporter with dynamic credentials
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      logger: true,
      debug: true,
    });
  }

  public async sendPassword(email: string, password: string): Promise<void> {
    const subject = 'Selamat Datang! Akses Akun Anda di Web CBT SMA 1 Payakumbuh';

    // Get the BASE_URL dynamically from the database
    const BASE_URL = await this.settingsRepository.findOne({ where: { key: 'BASE_URL' } });

    const html = `
      <p>Pengguna Yang Terhormat,</p>
      <p>Terima kasih telah mendaftar bersama kami! Anda sekarang dapat mengakses akun Anda dengan mengklik tautan di bawah ini:</p>
      <p><a href="${BASE_URL}">${BASE_URL}</a></p>
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

    await this.initializeTransporter();
    await this.sendEmail(email, subject, html);
  }

  public async resetPassword(email: string, resetLink: string): Promise<void> {
    const subject = 'Permintaan Reset Password';

    const html = `
      <p>Pengguna Yang Terhormat,</p>
      <p>Kami menerima permintaan untuk mengatur ulang password Anda. Untuk melanjutkan, silakan klik tautan di bawah ini:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Jika Anda tidak meminta untuk mengatur ulang password, Anda dapat mengabaikan email ini.</p>
      <p>Jika Anda mengalami kesulitan, jangan ragu untuk menghubungi tim dukungan kami.</p>
      <br />
      <footer style="font-size: 12px; color: #555;">
          <p>Salam Hormat,</p>
          <p>SMA 1 PAYAKUMBUH</p>
      </footer>
    `;

    await this.initializeTransporter(); 
    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: (await this.settingsRepository.findOne({ where: { key: 'EMAIL_USER' } })).value, 
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

