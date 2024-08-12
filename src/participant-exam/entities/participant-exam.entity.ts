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
  import { Users } from 'src/users/entities/user.entity';
  import { Class } from 'src/class/entities/class.entity';
  import { ParticipantType } from 'src/exam/enum/exam.enum';
  
  @Entity('participant_exam')
  export class ParticipantExam {
    @PrimaryGeneratedColumn({type : "bigint"})
    id: number;
  
    @Column({ type: 'enum', enum: ParticipantType })
    participantType: ParticipantType;

    @Column({ default: true })
    statusData: boolean;

    //relation 
    @ManyToOne(() => Exam, exam => exam.id)
    @JoinColumn({ name: 'examId' })
    exam: Exam;
  
    @ManyToOne(() => Class, classEntity => classEntity.id)
    @JoinColumn({ name: 'classId' })
    class: Class;
  
    @ManyToOne(() => Users, user => user.id)
    @JoinColumn({ name: 'userId' })
    user: Users;

  
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
  