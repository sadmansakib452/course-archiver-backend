import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class BulkAssignCoursesDto {
  @ApiProperty({
    description: 'Faculty ID to assign courses to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @ApiProperty({
    description: 'Array of course IDs to assign',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  courseIds: string[];
}
