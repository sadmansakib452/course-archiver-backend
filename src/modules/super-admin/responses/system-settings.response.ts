import { ApiProperty } from '@nestjs/swagger';

export class SystemSettingsResponse {
  @ApiProperty({ required: false })
  departmentName?: string;

  @ApiProperty({ required: false })
  departmentCode?: string;

  @ApiProperty({ required: false })
  maxFileSize?: number;

  @ApiProperty({ required: false })
  allowedFileTypes?: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  updatedBy: string;
}
