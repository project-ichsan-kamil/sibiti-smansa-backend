import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Exam {
  @PrimaryGeneratedColumn({type : "bigint"})
  id: number;

  @Column()
  title: string;

  @Column()
  examType: string;

  @Column()
  subject: number;

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column()
  duration: number;

  @Column()
  numberOfQuestions: number;

  @Column()
  numberOfOptions: number;

  @Column()
  participantType: string;

  @Column('simple-array')
  participants: string[];

  @Column()
  totalScore: number;

  @Column()
  passingScore: number;

  @Column()
  examStatus: string;

  @Column({default : true})
  dataStatus: boolean;

  @CreateDateColumn({ type: 'timestamp'})
  createdAt: Date;

  @Column({default : "SYSTEM"})
  createdBy : string;

  @UpdateDateColumn({ type: 'timestamp'})
  updatedAt: Date;

  @Column({default : "SYSTEM"})
  updatedBy : string;

  @BeforeInsert()
  generateProfileId() {
      this.id = new Date().valueOf();
  }
}
