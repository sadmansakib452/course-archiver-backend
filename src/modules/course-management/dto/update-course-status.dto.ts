import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCourseStatusDto {
  @ApiProperty({
    description: 'Course active status',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
