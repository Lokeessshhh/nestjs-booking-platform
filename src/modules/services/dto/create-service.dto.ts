import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut & Styling', description: 'The title of the service' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'Professional haircut, wash, and style package.',
    description: 'Detailed description of the service',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ example: 45, description: 'Duration of the service in minutes (must be at least 1)' })
  @IsInt()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @ApiProperty({ example: 50.0, description: 'Price of the service (must be non-negative)' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({ example: true, default: true, required: false, description: 'Whether the service is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
