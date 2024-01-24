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

    @Column({length : 255, default : '123123'})
    password : string;

    @Column({default : false})
    isVerified : boolean;

    @Column({default : 0})
    role : number;

    @CreateDateColumn({ type: 'timestamp'})
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp'})
    updatedAt: Date;

    @BeforeInsert()
    generateProfileId() {
        this.id = new Date().valueOf();
    }

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10)
    }
}
