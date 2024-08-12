import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { UserClass } from 'src/class/entities/user-class.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { ParticipantExam } from 'src/participant-exam/entities/participant-exam.entity';

@Entity()
export class Users {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: true })
    statusData: boolean;

    //relation

    @OneToOne(() => ProfileUser, profile => profile.user)
    profile: ProfileUser;

    @OneToMany(() => UserRole, userRole => userRole.user)
    userRoles: UserRole[];

    @OneToMany(() => UserClass, userClass => userClass.user)
    userClasses: UserClass[];

    @OneToMany(() => Exam, exam => exam.owner)
    examsOwned: Exam[];

    @OneToMany(() => ParticipantExam, participantExam => participantExam.user)
    participantExams: ParticipantExam[];


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
