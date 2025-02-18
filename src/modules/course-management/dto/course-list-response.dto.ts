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

  @ApiProperty({ type: FacultyData })
  faculty: FacultyData;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class PaginationData {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}

class CourseListData {
  @ApiProperty({ type: [CourseData] })
  courses: CourseData[];

  @ApiProperty({ type: PaginationData })
  pagination: PaginationData;
}

export class CourseListResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: CourseListData, required: false })
  data?: CourseListData;
}
