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

  @ApiProperty({ nullable: true })
  facultyId: string | null;

  @ApiProperty({ type: FacultyData, nullable: true })
  faculty: FacultyData | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isActive: boolean;
}

export class CourseResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: CourseData, required: false })
  data?: CourseData;
}
