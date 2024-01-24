import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ProfileUser {
    @PrimaryGeneratedColumn({type : 'bigint'})
    id : number;

    @Column()
    userId : number;

    @Column({length : 255})
    username : string;

    @Column({length : 255})
    email : string;

    @Column({nullable : true})
    noHp : string;

    @Column({nullable : true})
    sekolah : string;

    @Column({nullable : true})
    provinsi : string;

    @Column({nullable : true})
    kota : string;

    @Column({nullable : true})
    kelurahan : string;

    @CreateDateColumn({ type: 'timestamp'})
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp'})
    updatedAt: Date;

    @BeforeInsert()
    generateId() {
        this.id = new Date().valueOf();
    }
}
