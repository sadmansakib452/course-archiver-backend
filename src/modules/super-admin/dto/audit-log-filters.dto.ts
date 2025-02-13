import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AuditLogFilters {
  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter logs by specific user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 'USER_LOGIN',
    description: 'Filter logs by action type',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Filter logs from this date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Filter logs until this date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
