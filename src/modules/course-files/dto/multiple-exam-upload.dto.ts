import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ExamFileDto } from './exam-file.dto';

export class MultipleExamUploadDto {
  @ApiProperty({ type: [ExamFileDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamFileDto)
  exams: ExamFileDto[];
}
