import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';

@Entity()
export class Subject {
    @PrimaryGeneratedColumn({type : "bigint"})
    id: number;

    @Column()
    nama: string;

    @Column()
    deskripsi: string;

    @Column({ default: true })
    statusData: boolean;

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
