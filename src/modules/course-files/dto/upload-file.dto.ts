import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum FixedFileType {
  ATTENDANCE_SHEET = 'attendanceSheet',
  FINAL_GRADES = 'finalGrades',
  SUMMARY_OBE = 'summaryObe',
  INS_FEEDBACK = 'insFeedback',
  COURSE_OUTLINE = 'courseOutline',
  ASSIGNMENT = 'assignment',
  LAB_EXPERIMENT = 'labExperiment',
}

export class UploadFixedFileDto {
  @ApiProperty({
    enum: FixedFileType,
    description: 'Type of fixed file to upload',
  })
  @IsEnum(FixedFileType)
  fileType: FixedFileType;

  @ApiProperty({ description: 'Comments for the file' })
  @IsOptional()
  @IsString()
  comments?: string;
}
