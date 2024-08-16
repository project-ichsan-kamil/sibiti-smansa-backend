import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
  } from 'typeorm';
  import { Exam } from 'src/exam/entities/exam.entity';
  import { AnswerKey } from '../enum/question.enum';
  
  @Entity()
  export class Question {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;
  
    @ManyToOne(() => Exam, exam => exam.questions)
    @JoinColumn({ name: 'examId' })
    exam: Exam;
  
    @Column({nullable: false })
    questionNumber: number;
  
    @Column({ nullable: true })
    question: string;
  
    @Column({ nullable: true })
    A: string;
  
    @Column({ nullable: true })
    B: string;
  
    @Column({ nullable: true })
    C: string;
  
    @Column({ nullable: true })
    D: string;
  
    @Column({ nullable: true })
    E: string;
  
    @Column({ nullable: true })
    F: string;
  
    @Column({ type: 'enum', enum: AnswerKey, nullable: true })
    key: AnswerKey;

    @Column({ default: false })
    complete: boolean;
  
    @Column({ default: true })
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
    generateUniqueId() {
      // Generate a unique ID combining the current time and a random number
      this.id = Date.now() + Math.floor(Math.random() * 10000); 
    }
  }
  