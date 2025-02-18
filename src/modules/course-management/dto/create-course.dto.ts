import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Semester } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({
    example: 'CSE101',
    description: 'Course code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Section number',
  })
  @IsInt()
  @IsNotEmpty()
  section: number;

  @ApiProperty({
    enum: Semester,
    example: 'FALL',
    description: 'Semester (FALL, SPRING, SUMMER)',
  })
  @IsEnum(Semester)
  @IsNotEmpty()
  semester: Semester;

  @ApiProperty({
    example: 2024,
    description: 'Academic year',
  })
  @IsInt()
  @IsNotEmpty()
  year: number;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Faculty ID (optional)',
  })
  @IsOptional()
  @IsString()
  facultyId?: string;
}
