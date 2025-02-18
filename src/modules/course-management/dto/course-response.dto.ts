import { ApiProperty } from '@nestjs/swagger';
import { Semester } from '@prisma/client';

class CourseData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  section: number;

  @ApiProperty({ enum: Semester })
  semester: Semester;

  @ApiProperty()
  year: number;

  @ApiProperty()
  facultyId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CourseResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: CourseData, required: false })
  data?: CourseData;
}
