import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Template description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether this template is required' })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({
    description: 'Allowed file types',
    example: ['pdf', 'doc', 'docx'],
  })
  @IsArray()
  @IsString({ each: true })
  fileTypes: string[];

  @ApiProperty({ description: 'Maximum file size in bytes', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSize?: number;
}
