import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Semester } from '@prisma/client';

export class ListCourseDto {
  @ApiPropertyOptional({
    description: 'Search in course code or name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: Semester,
    description: 'Filter by semester',
  })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({
    description: 'Filter by year',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: 'Page number',
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    type: Number,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
