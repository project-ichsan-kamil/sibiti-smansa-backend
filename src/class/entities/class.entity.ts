import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from "typeorm";

@Entity()
export class Class {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ length: 255 })
    nama: string;

    @Column()
    kelas: number;

    @Column()
    status: number;

    @Column({ default: true })
    statusData: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({default : "SYSTEM"})
    createdBy: string;

    @Column( {default : "SYSTEM"})
    updatedBy: string;

    @BeforeInsert()
    generateProfileId() {
        this.id = new Date().valueOf();
    }
}
