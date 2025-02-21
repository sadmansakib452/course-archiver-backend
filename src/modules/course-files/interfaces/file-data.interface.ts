import { FileTemplate } from '@prisma/client';

export interface FileData {
  url: string;
  version: number;
  updatedAt: Date;
  hash?: string;
  approvedAt?: Date;
  comments?: string;
}

export interface CourseFileResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    courseId: string;
    userId: string;
    semester?: string;
    year?: number;
    status: string;
    comments?: string;
    // Fixed files
    attendanceSheet?: FileData;
    finalGrades?: FileData;
    summaryObe?: FileData;
    insFeedback?: FileData;
    courseOutline?: FileData;
    assignment?: FileData;
    labExperiment?: FileData;
    // Dynamic files
    customFiles?: Array<{
      name: string;
      fileData: FileData;
      template?: FileTemplate;
    }>;
    miscFiles?: Array<{
      name: string;
      fileData: FileData;
    }>;
    template?: FileTemplate;
  };
}
