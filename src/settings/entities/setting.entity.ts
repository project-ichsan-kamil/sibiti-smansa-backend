import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity() // The name of the table in the database
export class Setting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true })
  key: string; 

  @Column()
  value: string;

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
