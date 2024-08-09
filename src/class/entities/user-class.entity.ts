import { Users } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
} from 'typeorm';
import { Class } from './class.entity';

@Entity('user_class')
export class UserClass {
  @PrimaryGeneratedColumn({ type : 'bigint'})
  id: number;

  @ManyToOne(() => Users, user => user.userClasses)
  user: Users;

  @ManyToOne(() => Class, classEntity => classEntity.userClasses)
  classEntity: Class;

  @Column({ default: true })
  statusData: boolean;

  // audit fields
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ default: 'SYSTEM' })
  createdBy: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: 'SYSTEM' })
  updatedBy: string;

  @BeforeInsert()
  generateProfileId() {
    this.id = new Date().valueOf();
  }
}
