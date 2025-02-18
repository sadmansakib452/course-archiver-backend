import { ApiProperty } from '@nestjs/swagger';
import { Semester } from '@prisma/client';

class FacultyData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  shortName: string;
}

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

  @ApiProperty({ type: FacultyData })
  faculty?: FacultyData;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class BulkAssignResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [CourseData], required: false })
  data?: CourseData[];
}
