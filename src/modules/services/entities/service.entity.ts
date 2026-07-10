import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ValueTransformer,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

export const decimalTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? parseFloat(value) : null),
};

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  duration: number; // in minutes

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];
}
