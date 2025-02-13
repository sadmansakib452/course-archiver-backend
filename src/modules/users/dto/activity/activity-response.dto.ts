import { ApiProperty } from '@nestjs/swagger';

export class ActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  details: Record<string, any>;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  user: {
    name: string;
    email: string;
  };
}

export class ActivityPaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}

export class ActivityListResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  activities: ActivityResponseDto[];

  @ApiProperty()
  pagination: ActivityPaginationDto;
}
