import { ProfileUser } from 'src/profile-user/entities/profile-user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToOne } from 'typeorm';

@Entity()
export class Users {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @OneToOne(() => ProfileUser, profile => profile.user)
    profile: ProfileUser;

 
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

