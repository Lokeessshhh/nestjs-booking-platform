import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { ServicesService } from '../services/services.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

const mockBookingRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockServicesService = () => ({
  findOne: jest.fn(),
});

type MockRepository<T = any> = jest.Mocked<Record<keyof Repository<T>, jest.Mock>>;

describe('BookingsService', () => {
  let service: BookingsService;
  let repository: MockRepository<Booking>;
  let servicesService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useFactory: mockBookingRepository,
        },
        {
          provide: ServicesService,
          useFactory: mockServicesService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repository = module.get(getRepositoryToken(Booking));
    servicesService = module.get(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if booking date/time is in the past', async () => {
      servicesService.findOne.mockResolvedValue({ id: 'srv-1', title: 'Haircut', isActive: true });

      const createDto = {
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        customerPhone: '12345678',
        serviceId: 'srv-1',
        bookingDate: '2020-01-01',
        bookingTime: '10:00',
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if booking slot is already taken', async () => {
      servicesService.findOne.mockResolvedValue({ id: 'srv-1', title: 'Haircut', isActive: true });
      repository.findOne.mockResolvedValue({ id: 'booking-existing' });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

      const createDto = {
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        customerPhone: '12345678',
        serviceId: 'srv-1',
        bookingDate: tomorrowDateStr,
        bookingTime: '14:30',
      };

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException when trying to complete a cancelled booking', async () => {
      const mockBooking = { id: 'bk-1', status: BookingStatus.CANCELLED };
      repository.findOne.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus('bk-1', { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to modify a completed booking', async () => {
      const mockBooking = { id: 'bk-1', status: BookingStatus.COMPLETED };
      repository.findOne.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus('bk-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
