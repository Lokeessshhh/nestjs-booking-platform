import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { createPaginatedResponse } from '../../common/pagination/pagination.util';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(service);
  }

  async findAll(paginationDto: PaginationDto, isManager: boolean) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (!isManager) {
      queryBuilder.where('service.isActive = :isActive', { isActive: true });
    }

    queryBuilder
      .orderBy('service.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string, isManager: boolean): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    if (!isManager && !service.isActive) {
      throw new NotFoundException(`Service with ID "${id}" is currently inactive`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id, true);
    const updatedService = this.serviceRepository.merge(service, updateServiceDto);
    return this.serviceRepository.save(updatedService);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id, true);

    try {
      await this.serviceRepository.remove(service);
    } catch (error) {
      // Postgres code 23503 is foreign key violation (linked bookings exist)
      if ((error as any).code === '23503') {
        throw new BadRequestException(
          'Cannot delete service because it has associated bookings. Try setting isActive to false instead.',
        );
      }
      throw error;
    }
  }
}
