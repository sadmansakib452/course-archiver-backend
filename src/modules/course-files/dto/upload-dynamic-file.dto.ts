import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsMongoId,
} from 'class-validator';

export class UploadDynamicFileDto {
  @ApiProperty({
    description: 'Name/identifier for the dynamic file',
    example: 'project_guidelines',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'File name can only contain letters, numbers, underscores and hyphens',
  })
  name: string;

  @ApiProperty({
    description: 'Type of dynamic file (custom/misc)',
    enum: ['custom', 'misc'],
  })
  @IsString()
  @IsNotEmpty()
  type: 'custom' | 'misc';

  @ApiProperty({
    description: 'Template ID if using a template',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    description: 'Department code for template filtering',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Comments for the file' })
  @IsOptional()
  @IsString()
  comments?: string;
}
