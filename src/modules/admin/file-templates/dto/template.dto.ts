import { ApiProperty } from '@nestjs/swagger';
import { FileTemplate } from '@prisma/client';

export class TemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty({ type: [String] })
  fileTypes: string[];

  @ApiProperty()
  maxSize: number;

  @ApiProperty()
  department: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Add static mapper method
  static fromEntity(entity: FileTemplate): TemplateDto {
    return {
      ...entity,
    };
  }
}
