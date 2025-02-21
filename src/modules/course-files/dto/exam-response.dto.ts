import { ApiProperty } from '@nestjs/swagger';
import { FileData } from '../interfaces/file-data.interface';

export class ExamUploadResponse {
  @ApiProperty()
  examId: string;

  @ApiProperty()
  examNumber?: number;

  @ApiProperty()
  uploadedFiles: string[];

  @ApiProperty()
  pendingFiles: string[];

  @ApiProperty()
  isComplete: boolean;
}

export class MultipleExamResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [ExamUploadResponse] })
  data: {
    courseId: string;
    exams: ExamUploadResponse[];
  };
}
