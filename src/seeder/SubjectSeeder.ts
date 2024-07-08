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
        const subjects = [
            // Kelompok A (Wajib)
            { nama: 'Pendidikan Agama', deskripsi: 'Pelajaran yang mempelajari tentang agama dan budi pekerti.' },
            { nama: 'PKN', deskripsi: 'Pelajaran yang mempelajari tentang Pancasila dan kewarganegaraan.' },
            { nama: 'Bahasa Indonesia', deskripsi: 'Pelajaran yang mempelajari tentang bahasa dan sastra Indonesia.' },
            { nama: 'Matematika', deskripsi: 'Pelajaran yang mempelajari tentang angka dan operasi aritmetika.' },
            { nama: 'Sejarah Indonesia', deskripsi: 'Pelajaran yang mempelajari tentang sejarah Indonesia.' },
            { nama: 'Bahasa Inggris', deskripsi: 'Pelajaran yang mempelajari tentang bahasa dan sastra Inggris.' },

            // Kelompok B (Wajib)
            { nama: 'Seni Budaya', deskripsi: 'Pelajaran yang mempelajari tentang seni dan budaya.' },
            { nama: 'Penjaskes', deskripsi: 'Pelajaran yang mempelajari tentang pendidikan jasmani, olahraga, dan kesehatan.' },

            // Kelompok C (Peminatan) - IPA
            { nama: 'Matematika Peminatan', deskripsi: 'Pelajaran peminatan yang mempelajari tentang matematika lebih mendalam.' },
            { nama: 'Fisika', deskripsi: 'Pelajaran yang mempelajari tentang sifat dan fenomena alam.' },
            { nama: 'Kimia', deskripsi: 'Pelajaran yang mempelajari tentang zat dan reaksi kimia.' },
            { nama: 'Biologi', deskripsi: 'Pelajaran yang mempelajari tentang makhluk hidup dan kehidupan.' },

            // Kelompok C (Peminatan) - IPS
            { nama: 'Geografi', deskripsi: 'Pelajaran yang mempelajari tentang lokasi dan interaksi antara manusia dan lingkungan.' },
            { nama: 'Sejarah Peminatan', deskripsi: 'Pelajaran peminatan yang mempelajari tentang sejarah lebih mendalam.' },
            { nama: 'Sosiologi', deskripsi: 'Pelajaran yang mempelajari tentang masyarakat dan interaksi sosial.' },
            { nama: 'Ekonomi', deskripsi: 'Pelajaran yang mempelajari tentang ekonomi dan keuangan.' },

            // Kelompok C (Peminatan) - Ilmu Bahasa dan Budaya
            { nama: 'Bahasa dan Sastra Indonesia', deskripsi: 'Pelajaran yang mempelajari tentang bahasa dan sastra Indonesia.' },
            { nama: 'Bahasa dan Sastra Inggris', deskripsi: 'Pelajaran yang mempelajari tentang bahasa dan sastra Inggris.' },
            { nama: 'Bahasa Jepang', deskripsi: 'Pelajaran yang mempelajari bahasa asing lainnya seperti Bahasa Jepang, Bahasa Mandarin, dll.' },
            { nama: 'Antropologi', deskripsi: 'Pelajaran yang mempelajari tentang manusia dan kebudayaannya.' },

            // Mata Pelajaran Pilihan Lainnya
            { nama: 'TIK)', deskripsi: 'Pelajaran yang mempelajari tentang teknologi informasi dan komunikasi.' },
            { nama: 'Kewirausahaan', deskripsi: 'Pelajaran yang mempelajari tentang kewirausahaan dan bisnis.' },
        ];

        for (const data of subjects) {
            const subject = this.subjectRepository.create(data);
            await this.subjectRepository.save(subject);
        }
    }
}
