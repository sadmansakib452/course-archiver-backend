import { ApiProperty } from '@nestjs/swagger';
import { FileData } from '../interfaces/file-data.interface';

export class CourseFileResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: {
    id: string;
    courseId: string;
    userId: string;
    // ... other properties matching the interface
  };
}
