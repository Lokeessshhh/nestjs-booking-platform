import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('bookings')
@Index('idx_booking_service_datetime_unique', ['serviceId', 'bookingDate', 'bookingTime'], {
  unique: true,
  where: `"status" != 'CANCELLED'`, // Double quotes for column name, single quotes for string literal
})
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @Column({ type: 'date' })
  bookingDate: string; // Format: YYYY-MM-DD

  @Column({ type: 'time' })
  bookingTime: string; // Format: HH:MM

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'RESTRICT', // Prevent service from being deleted if there are bookings
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;
}
