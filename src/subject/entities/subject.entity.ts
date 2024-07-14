import { UserRole } from 'src/user-role/entities/user-role.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';

@Entity()
export class Subject {
    @PrimaryGeneratedColumn({type : "bigint"})
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ default: true })
    statusData: boolean;

    @OneToMany(() => UserRole, userRole => userRole.subject)
    userRoles: UserRole[];

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
