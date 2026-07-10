import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { BookingStatus } from '../entities/booking.entity';

export class GetBookingsFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter bookings by status',
  })
  @IsEnum(BookingStatus, {
    message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    example: 'Alice',
    description: 'Search search term matching customer name, email, phone, or service title',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
