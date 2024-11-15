import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';

@Entity()
export class SebExam {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    name: string;

    @Column()
    password: string;

    @Column()
    examLink: string;

    @Column()
    exitCode: string;

    @Column({ default: true })
    statusData: boolean;

     // audit fields
     @CreateDateColumn({ type: 'timestamp' })
     createdAt: Date;
 
     @Column({ default: "SYSTEM" })
     createdBy: string;
 
     @UpdateDateColumn({ type: 'timestamp' })
     updatedAt: Date;
 
     @Column({ default: "SYSTEM" })
     updatedBy: string;
 
     @BeforeInsert()
     generateProfileId() {
         this.id = new Date().valueOf();
     }
}
