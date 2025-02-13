import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'admin@university.edu',
    description: 'Email address of the admin user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'System Admin',
    description: 'Full name of the admin user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Admin123',
    description: 'Temporary password that will be sent to admin email',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  temporaryPassword: string;

  @ApiProperty({
    example: 'CSE',
    description: 'Department code for the admin',
  })
  @IsString()
  @IsNotEmpty()
  departmentCode: string;
}
