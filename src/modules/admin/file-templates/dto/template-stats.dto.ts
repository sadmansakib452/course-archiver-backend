import { ApiProperty } from '@nestjs/swagger';
import { TemplateDto } from './template.dto';

export class TemplateUsageDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  usedAt: Date;
}

export class TemplateStatsDto extends TemplateDto {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ type: [TemplateUsageDto] })
  recentUsage: TemplateUsageDto[];
}
