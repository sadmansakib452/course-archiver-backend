import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsNotEmpty } from 'class-validator';
import { Semester } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({
    example: 'CSE101',
    description: 'Course code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Section number',
  })
  @IsInt()
  @IsNotEmpty()
  section: number;

  @ApiProperty({
    enum: Semester,
    example: 'FALL',
    description: 'Semester (FALL, SPRING, SUMMER)',
  })
  @IsEnum(Semester)
  @IsNotEmpty()
  semester: Semester;

  @ApiProperty({
    example: 2024,
    description: 'Academic year',
  })
  @IsInt()
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID from FacultyMember model (must be an active faculty)',
  })
  @IsString()
  @IsNotEmpty()
  facultyId: string;
}
