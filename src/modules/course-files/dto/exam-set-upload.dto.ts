import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ExamType } from './exam-file.dto';

export class ExamSetUploadDto {
  @ApiProperty({
    enum: ExamType,
    description: 'Type of exam (MID, QUIZ, or FINAL)',
  })
  @IsEnum(ExamType)
  examType: ExamType;

  @ApiProperty({
    description: 'Exam number (required for MID and QUIZ)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  examNumber?: number;

  @ApiProperty({
    description: 'Set number for multiple uploads (1 or 2)',
    example: 1,
  })
  @IsNumber()
  setNumber: number;
} 