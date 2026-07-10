import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Alice Smith', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @ApiProperty({ example: 'alice@example.com', description: 'Customer email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Customer email is required' })
  customerEmail: string;

  @ApiProperty({ example: '+1234567890', description: 'Customer contact phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone number is required' })
  customerPhone: string;

  @ApiProperty({
    example: 'd3b07384-d113-4ec5-a587-3d122e2360ec',
    description: 'The UUID of the service to book',
  })
  @IsUUID('4', { message: 'Invalid service ID format' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  @ApiProperty({ example: '2026-08-15', description: 'Date of booking in YYYY-MM-DD format' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Booking date must be in YYYY-MM-DD format',
  })
  @IsNotEmpty({ message: 'Booking date is required' })
  bookingDate: string;

  @ApiProperty({ example: '14:30', description: 'Time of booking in HH:MM format (24-hour style)' })
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'Booking time must be in HH:MM format',
  })
  @IsNotEmpty({ message: 'Booking time is required' })
  bookingTime: string;

  @ApiProperty({
    example: 'Prefers a window seat if possible.',
    required: false,
    description: 'Optional customer notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
