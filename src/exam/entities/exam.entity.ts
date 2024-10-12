// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
//   ManyToOne,
//   JoinColumn,
//   BeforeInsert,
// } from 'typeorm';
// import { Subject } from 'src/subject/entities/subject.entity';
// import { Users } from 'src/users/entities/user.entity';
// import { ExamDuration, ExamType, ParticipantType, StatusExam, SumOption, SumQuestion } from '../enum/exam.enum';

// @Entity()
// export class Exam {
//   @PrimaryGeneratedColumn({ type: 'bigint' })
//   id: number;

//   @Column({ unique: true, nullable: false })
//   name: string;

//   @Column({ type: 'enum', enum: ExamType })
//   type: ExamType;

//   @Column({ type: 'timestamp' })
//   startDate: Date;

//   @Column({ type: 'time' })
//   time: string;

//   @Column({ type: 'enum', enum: ExamDuration })
//   duration: ExamDuration;

//   @Column({ type: 'enum', enum: SumQuestion })
//   sumQuestion: SumQuestion;

//   @Column({ type: 'enum', enum: SumOption })
//   sumOption: SumOption;

//   @Column({ type: 'int' })
//   passingGrade: number;

//   @Column({ type: 'boolean' })
//   randomize: boolean;

//   @Column({ type: 'enum', enum: StatusExam })
//   statusExam: StatusExam;

//   @Column({ type: 'enum', enum: ParticipantType })
//   participantType: ParticipantType;

//   @Column({ type: 'boolean' })
//   sameAsOtherExam: boolean;

//   @Column({ type: 'boolean' })
//   shareExam: boolean;

//   @Column({ default: true })
//   statusData: boolean;

//   // Relasi ke Users sebagai owner ujian
//   @ManyToOne(() => Users)
//   @JoinColumn({ name: 'ownerId' })
//   owner: Users;

//   // Relasi ke Exam lainnya
//   @ManyToOne(() => Exam)
//   @JoinColumn({ name: 'otherExamId' })
//   otherExam: Exam;

//   // Relasi ke Subject
//   @ManyToOne(() => Subject)
//   @JoinColumn({ name: 'subjectId' })
//   subject: Subject;

//   // Relasi ke submitter (User)
//   @ManyToOne(() => Users)
//   @JoinColumn({ name: 'submitterId' })
//   submitterId: Users;

//   // Audit Fields
//   @CreateDateColumn({ type: 'timestamp' })
//   createdAt: Date;

//   @Column({ default: 'SYSTEM' })
//   createdBy: string;

//   @UpdateDateColumn({ type: 'timestamp' })
//   updatedAt: Date;

//   @Column({ default: 'SYSTEM' })
//   updatedBy: string;

//   @BeforeInsert()
//   generateProfileId() {
//     this.id = new Date().valueOf();
//   }
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Users } from 'src/users/entities/user.entity';
import {
  ExamDuration,
  ExamType,
  ParticipantType,
  StatusExam,
  SumOption,
  SumQuestion,
} from '../enum/exam.enum';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';
import { Question } from 'src/question/entities/question.entity';

@Entity()
export class Exam {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({nullable: false })
  name: string;

  @Column({ type: 'enum', enum: ExamType })
  type: ExamType;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'enum', enum: ExamDuration })
  duration: ExamDuration;

  @Column({ type: 'enum', enum: SumQuestion })
  sumQuestion: SumQuestion;

  @Column({ type: 'enum', enum: SumOption })
  sumOption: SumOption;

  @Column({ type: 'int' })
  passingGrade: number;

  @Column({ type: 'boolean' })
  randomize: boolean;

  @Column({ type: 'enum', enum: StatusExam })
  statusExam: StatusExam;

  @Column({ type: 'enum', enum: ParticipantType })
  participantType: ParticipantType;

  @Column({ type: 'boolean', default : false })
  sameAsOtherExam: boolean;

  @Column({ type: 'boolean' })
  shareExam: boolean;

  @Column({ default: true })
  statusData: boolean;

  // Relasi ke Users sebagai owner ujian - Bidirectional
  @ManyToOne(() => Users, (user) => user.examsOwned)
  @JoinColumn({ name: 'ownerId' })
  owner: Users;

  // Relasi ke Exam lainnya - Unidirectional
  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'otherExamId' })
  otherExam: Exam;

  // Relasi ke Subject - Unidirectional
  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  // Relasi ke submitter (User) - Unidirectional
  @ManyToOne(() => Users)
  @JoinColumn({ name: 'submitterId' })
  submitter: Users; // Menyimpan userId dari pengguna yang akan submit soal

  @OneToMany(() => ParticipantExam, (participantExam) => participantExam.exam)
  participants: ParticipantExam[];

  // Relasi ke Question - Bidirectional
  @OneToMany(() => Question, (question) => question.exam)
  questions: Question[];

  // Audit Fields
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ default: 'SYSTEM' })
  createdBy: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: 'SYSTEM' })
  updatedBy: string;

  @BeforeInsert()
  generateProfileId() {
    this.id = new Date().valueOf();
  }
}
