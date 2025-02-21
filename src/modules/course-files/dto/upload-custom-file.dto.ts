import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class UploadCustomFileDto {
  @ApiProperty({
    description: 'Name/identifier for the custom file',
    example: 'project_guidelines',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Template ID if using a template',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: 'Comments for the file' })
  @IsString()
  @IsOptional()
  comments?: string;
}
