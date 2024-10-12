import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BeforeInsert,
  Index,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { StatusAbsent } from '../enum/absent.enum';

@Entity()
export class Absent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  latitude: string;

  @Column({ type: 'text', nullable: true })
  longitude: string;

  @Column({
    type: 'enum',
    enum: StatusAbsent,
    default: StatusAbsent.PRESENT,
  })
  status: StatusAbsent;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  urlFile: string;

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
  generateId() {
    this.id = new Date().valueOf();
  }
}
