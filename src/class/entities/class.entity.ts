import { Users } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { UserClass } from './user-class.entity';

@Entity()
export class Class {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  class: number;

  @Column()
  status: number;

  @Column({ default: true })
  statusData: boolean;

  //relation
  @OneToMany(() => UserClass, (userClass) => userClass.classEntity)
  userClasses: UserClass[];

  //audit
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: 'SYSTEM' })
  createdBy: string;

  @Column({ default: 'SYSTEM' })
  updatedBy: string;
}
