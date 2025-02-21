import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class SearchTemplateDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'createdAt' | 'usageCount';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
