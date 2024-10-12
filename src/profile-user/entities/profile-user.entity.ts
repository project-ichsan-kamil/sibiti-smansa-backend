import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BeforeInsert, OneToOne, JoinColumn } from 'typeorm';
import { Users } from 'src/users/entities/user.entity';

@Entity()
export class ProfileUser {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    id: number;

    @Column()
    userId: number; 

    @Column()
    fullName: string;

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

    @Column()
    encrypt : string;

    @Column({default : true})
    statusData : boolean;

    
    //relation
    @OneToOne(() => Users, user => user.profile)
    @JoinColumn()
    user: Users;
    

    //audit
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
