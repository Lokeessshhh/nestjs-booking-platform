import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { NotFoundException } from '@nestjs/common';

const mockServiceRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

type MockRepository<T = any> = jest.Mocked<Record<keyof Repository<T>, jest.Mock>>;

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: MockRepository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useFactory: mockServiceRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a service', async () => {
      const createDto = {
        title: 'Haircut',
        description: 'Quality trim',
        duration: 30,
        price: 25.0,
      };
      repository.create.mockReturnValue(createDto);
      repository.save.mockResolvedValue({ id: 'uuid-1', ...createDto });

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'uuid-1');
    });
  });

  describe('findOne', () => {
    it('should return a service by ID if it exists and user is manager (even if inactive)', async () => {
      const mockResult = { id: 'uuid-1', title: 'Haircut', isActive: false };
      repository.findOne.mockResolvedValue(mockResult);

      const result = await service.findOne('uuid-1', true);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if service is inactive and user is not manager', async () => {
      const mockResult = { id: 'uuid-1', title: 'Haircut', isActive: false };
      repository.findOne.mockResolvedValue(mockResult);

      await expect(service.findOne('uuid-1', false)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-none', true)).rejects.toThrow(NotFoundException);
    });
  });
});
