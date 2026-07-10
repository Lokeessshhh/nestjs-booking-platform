import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsFilterDto } from './dto/get-bookings-filter.dto';
import { ServicesService } from '../services/services.service';
import { createPaginatedResponse } from '../../common/pagination/pagination.util';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { serviceId, bookingDate, bookingTime } = createBookingDto;

    // 1. Validate service exists and is active (throws 404 if not found/active for customers)
    await this.servicesService.findOne(serviceId, false);

    // 2. Validate date and time are not in the past
    // Split date and time components to avoid timezone shift errors during parsing
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    if (bookingDateTime < now) {
      throw new BadRequestException('Booking date and time cannot be in the past');
    }

    // 3. Prevent duplicate bookings for the same service, date, and time
    const activeBooking = await this.bookingRepository.findOne({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: Not(BookingStatus.CANCELLED),
      },
    });

    if (activeBooking) {
      throw new ConflictException(
        'This service is already booked at the requested date and time',
      );
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    try {
      return await this.bookingRepository.save(booking);
    } catch (error) {
      // Postgres code 23505 is unique index violation
      if ((error as any).code === '23505') {
        throw new ConflictException(
          'This service is already booked at the requested date and time',
        );
      }
      throw error;
    }
  }

  async findAll(filterDto: GetBookingsFilterDto) {
    const { page = 1, limit = 10, status, search } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service');

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search OR booking.customerPhone ILIKE :search OR service.title ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('booking.bookingDate', 'DESC')
      .addOrderBy('booking.bookingTime', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { service: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const { status: newStatus } = updateBookingStatusDto;
    const booking = await this.findOne(id);

    if (booking.status === newStatus) {
      return booking;
    }

    // Business rule: Cancelled bookings cannot be marked as completed (or modified at all)
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot update status of a cancelled booking. Cancelled status is permanent.',
      );
    }

    // Business rule: Completed bookings cannot be updated
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot update status of a completed booking. Completed status is permanent.',
      );
    }

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking.');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
