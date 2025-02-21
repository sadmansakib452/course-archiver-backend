export interface ExamUploadResult {
  examId: string;
  examNumber: number;
  uploadedFiles: string[];
  pendingFiles: string[];
  isComplete: boolean;
} 