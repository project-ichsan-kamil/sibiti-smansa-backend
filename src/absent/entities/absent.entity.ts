import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, BeforeInsert } from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { StatusAbsent } from '../enum/absent.enum';

@Entity()
export class Absent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users)
  user: Users;

  @Column('date')
  date: string;

  @Column('timestamp')
  time: Date;

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
  photoLink: string;

  @Column({ default: true })
  statusData: boolean;

  // audit
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ default: "SYSTEM" })
  createdBy: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: "SYSTEM" })
  updatedBy: string;

  @BeforeInsert()
  generateId() {
      this.id = new Date().valueOf();
  }
}
