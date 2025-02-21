import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadCustomFileDto {
  @ApiProperty({
    description: 'Name/identifier for the custom file',
    example: 'project_guidelines',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Comments for the file' })
  @IsString()
  @IsOptional()
  comments?: string;
}
