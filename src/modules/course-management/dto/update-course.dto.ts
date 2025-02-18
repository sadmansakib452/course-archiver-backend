import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Semester } from '@prisma/client';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'CSE101',
    description: 'Course code',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Section number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  section?: number;

  @ApiPropertyOptional({
    enum: Semester,
    example: 'FALL',
    description: 'Semester (FALL, SPRING, SUMMER)',
  })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({
    example: 2024,
    description: 'Academic year',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Faculty ID who will teach this course',
  })
  @IsOptional()
  @IsString()
  facultyId?: string;
}
