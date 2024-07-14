import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, JoinColumn, ManyToOne } from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Entity()
export class UserRole {
    @PrimaryGeneratedColumn({type: 'bigint'})
    id: number;

    @ManyToOne(() => Users, user => user.userRoles)
    @JoinColumn({ name: 'userId' })
    user: Users;

    @Column()
    role: string;

    @Column({ default: true })
    statusData: boolean;

    @ManyToOne(() => Subject, subject => subject.userRoles)
    @JoinColumn({ name: 'subjectId' })
    subject: Subject;

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

