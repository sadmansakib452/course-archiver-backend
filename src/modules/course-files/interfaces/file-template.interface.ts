import { FileData } from './file-data.interface';
import { FileStatus } from '@prisma/client';
import { FileTemplate as PrismaFileTemplate } from '@prisma/client';

// Re-export the Prisma type
export type FileTemplate = PrismaFileTemplate;

export interface CustomFileUpload {
  templateId: string;
  fileData: FileData;
  status: FileStatus;
  uploadedAt: Date;
}

export interface MiscFileUpload {
  name: string;
  fileData: FileData;
  status: FileStatus;
  uploadedAt: Date;
}
