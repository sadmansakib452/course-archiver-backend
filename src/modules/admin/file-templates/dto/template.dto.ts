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
  status: boolean;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Remove department from mapper
  static fromEntity(entity: FileTemplate): TemplateDto {
    const {
      id,
      name,
      description,
      isRequired,
      fileTypes,
      maxSize,
      status,
      createdBy,
      createdAt,
      updatedAt,
    } = entity;

    return {
      id,
      name,
      description,
      isRequired,
      fileTypes,
      maxSize,
      status,
      createdBy,
      createdAt,
      updatedAt,
    };
  }
}
