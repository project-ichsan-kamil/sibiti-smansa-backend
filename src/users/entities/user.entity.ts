import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from "typeorm";
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
    @PrimaryGeneratedColumn({type : "bigint"})
    id: number;

    @Column({length : 255})
    username : string;

    @Column({length : 255})
    email : string;

    @Column({length : 255})
    password : string;

    @Column({default : false})
    isVerified : boolean;

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

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10)
    }
}
