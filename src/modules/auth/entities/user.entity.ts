import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Hide from standard SELECT queries for security
  @Exclude() // Hide from JSON serialization
  password?: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', nullable: true, select: false }) // Hide by default for security
  @Exclude() // Hide from JSON serialization
  refreshTokenHash?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
