import { ApiProperty } from '@nestjs/swagger';

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

export class TemplateStatsDto {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ type: [TemplateUsageDto] })
  recentUsage: TemplateUsageDto[];
}
