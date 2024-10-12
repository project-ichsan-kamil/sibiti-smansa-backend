import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { StatusAnswer } from '../enum/status-answer.enum';

@Entity()
export class ParticipantAnswer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'userId' })
  user: Users;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column({ type: 'timestamp' })
  timeStarted: Date;

  @Column({ type: 'timestamp' })
  timeFinish: Date;

  @Column({ type: 'text' })
  randomQuestionNumber: string;

  @Column({ type: 'text' })
  listAnswers: string;

  @Column({ type: 'text' , default: null })
  listCorrectAnswer: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'text', default: null})
  latitude: string;

  @Column({ type: 'text', default: null})
  longitude : string;

  @Column({ type: 'int', default: 0 })
  countCheating: number;

  @Column({ type: 'enum', enum: StatusAnswer })
  status: StatusAnswer;

  @Column({ type: 'boolean', default: true })
  statusData: boolean;

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
  generateId() {
    this.id = new Date().valueOf();
  }
}
