import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';

@Injectable()
export class SubjectSeeder {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  public async run() {
    const count = await this.subjectRepository.count();
    if (count === 0) {
      const subjects = [
        // Kelompok A (Wajib)
        {
          name: 'Pendidikan Agama',
          description:
            'Pelajaran yang mempelajari tentang agama dan budi pekerti.',
        },
        {
          name: 'PKN',
          description:
            'Pelajaran yang mempelajari tentang Pancasila dan kewarganegaraan.',
        },
        {
          name: 'Bahasa Indonesia',
          description:
            'Pelajaran yang mempelajari tentang bahasa dan sastra Indonesia.',
        },
        {
          name: 'Matematika',
          description:
            'Pelajaran yang mempelajari tentang angka dan operasi aritmetika.',
        },
        {
          name: 'Sejarah Indonesia',
          description: 'Pelajaran yang mempelajari tentang sejarah Indonesia.',
        },
        {
          name: 'Bahasa Inggris',
          description:
            'Pelajaran yang mempelajari tentang bahasa dan sastra Inggris.',
        },

        // Kelompok B (Wajib)
        {
          name: 'Seni Budaya',
          description: 'Pelajaran yang mempelajari tentang seni dan budaya.',
        },
        {
          name: 'Penjaskes',
          description:
            'Pelajaran yang mempelajari tentang pendidikan jasmani, olahraga, dan kesehatan.',
        },

        // Kelompok C (Peminatan) - IPA
        {
          name: 'Matematika Peminatan',
          description:
            'Pelajaran peminatan yang mempelajari tentang matematika lebih mendalam.',
        },
        {
          name: 'Fisika',
          description:
            'Pelajaran yang mempelajari tentang sifat dan fenomena alam.',
        },
        {
          name: 'Kimia',
          description: 'Pelajaran yang mempelajari tentang zat dan reaksi kimia.',
        },
        {
          name: 'Biologi',
          description:
            'Pelajaran yang mempelajari tentang makhluk hidup dan kehidupan.',
        },

        // Kelompok C (Peminatan) - IPS
        {
          name: 'Geografi',
          description:
            'Pelajaran yang mempelajari tentang lokasi dan interaksi antara manusia dan lingkungan.',
        },
        {
          name: 'Sejarah Peminatan',
          description:
            'Pelajaran peminatan yang mempelajari tentang sejarah lebih mendalam.',
        },
        {
          name: 'Sosiologi',
          description:
            'Pelajaran yang mempelajari tentang masyarakat dan interaksi sosial.',
        },
        {
          name: 'Ekonomi',
          description: 'Pelajaran yang mempelajari tentang ekonomi dan keuangan.',
        },

        // Kelompok C (Peminatan) - Ilmu Bahasa dan Budaya
        {
          name: 'Bahasa dan Sastra Indonesia',
          description:
            'Pelajaran yang mempelajari tentang bahasa dan sastra Indonesia.',
        },
        {
          name: 'Bahasa dan Sastra Inggris',
          description:
            'Pelajaran yang mempelajari tentang bahasa dan sastra Inggris.',
        },
        {
          name: 'Bahasa Jepang',
          description:
            'Pelajaran yang mempelajari bahasa asing lainnya seperti Bahasa Jepang, Bahasa Mandarin, dll.',
        },
        {
          name: 'Antropologi',
          description:
            'Pelajaran yang mempelajari tentang manusia dan kebudayaannya.',
        },

        // Mata Pelajaran Pilihan Lainnya
        {
          name: 'TIK',
          description:
            'Pelajaran yang mempelajari tentang teknologi informasi dan komunikasi.',
        },
        {
          name: 'Kewirausahaan',
          description:
            'Pelajaran yang mempelajari tentang kewirausahaan dan bisnis.',
        },
      ];

      await this.subjectRepository.save(subjects);
      console.log('Subjects table has been seeded');
    } else {
      console.log('Subjects table is not empty, seeder skipped');
    }
  }
}
