import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxFileSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  allowedFileTypes?: string;
}
