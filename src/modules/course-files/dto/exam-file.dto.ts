import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

/**
 * Enum representing different types of exams in the system
 */
export enum ExamType {
  /** Mid-term examination */
  MID = 'MID',
  /** Quiz examination */
  QUIZ = 'QUIZ',
  /** Final examination */
  FINAL = 'FINAL',
}

/**
 * Enum representing different components of an exam file
 */
export enum ExamFileType {
  /** Question paper file */
  QUESTION = 'question',
  /** Highest marks sample file */
  HIGHEST = 'highest',
  /** Average marks sample file */
  AVERAGE = 'average',
  /** Marginal marks sample file */
  MARGINAL = 'marginal',
}

/**
 * DTO for exam file upload request
 */
export class ExamFileDto {
  @ApiProperty({
    enum: ExamType,
    description: 'Type of exam (MID, QUIZ, or FINAL)',
    example: ExamType.MID,
  })
  @IsEnum(ExamType)
  examType: ExamType;

  @ApiPropertyOptional({
    description: 'Exam number (required for MID and QUIZ)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  examNumber?: number;

  @ApiProperty({
    enum: ExamFileType,
    description: 'Type of file component',
    example: ExamFileType.QUESTION,
  })
  @IsEnum(ExamFileType)
  fileType: ExamFileType;
}
