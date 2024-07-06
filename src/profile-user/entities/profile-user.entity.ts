import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BeforeInsert, OneToOne, JoinColumn } from 'typeorm';
import { Class } from 'src/class/entities/class.entity';
import { Users } from 'src/users/entities/user.entity';

@Entity()
export class ProfileUser {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    id: number;

    @Column()
    fullName: string;

    @Column()
    userId: number;

    @Column({ nullable: true })
    email: string;
    
    @ManyToMany(type => Class)
    @JoinTable({ name: 'profile_user_class' })
    userClass: Class[];

    @Column({ nullable: true })
    fotoProfile?: string; // Opsional

    @Column({ nullable: true })
    noHp?: string; // Opsional

    @Column({ nullable: true })
    provinsi?: string; // Opsional

    @Column({ nullable: true })
    kota?: string; // Opsional

    @Column({ nullable: true })
    kelurahan?: string; // Opsional

    @OneToOne(() => Users, user => user.profile)
    @JoinColumn()
    user: Users;

    @Column()
    encrypt : string;

    @Column({default : true})
    statusData : boolean;

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
