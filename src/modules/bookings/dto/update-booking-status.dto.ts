import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    description: 'New status of the booking',
  })
  @IsEnum(BookingStatus, {
    message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: BookingStatus;
}
