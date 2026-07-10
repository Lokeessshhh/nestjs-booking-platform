import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'manager@en2h.com', description: 'Manager email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'Manager password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
