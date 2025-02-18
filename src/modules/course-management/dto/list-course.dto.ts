import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Semester } from '@prisma/client';

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

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
  @Transform(({ value }) => {
    // If array is passed, take the first value
    return Array.isArray(value) ? (value[0] as Semester) : (value as Semester);
  })
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
    description: 'Filter by faculty ID',
  })
  @IsOptional()
  @IsString()
  facultyId?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['code', 'name', 'section', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['code', 'name', 'section', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

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
