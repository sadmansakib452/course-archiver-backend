import { IsString, IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.FACULTY,
    description: 'User role',
  })
  @IsEnum(UserRole, {
    message: 'Role must be one of: SUPER_ADMIN, ADMIN, CHAIRPERSON, FACULTY',
  })
  role: UserRole;

  @ApiProperty({
    example: 'CSE',
    description: 'Department code',
  })
  @IsString()
  @IsNotEmpty()
  departmentCode: string;
}
