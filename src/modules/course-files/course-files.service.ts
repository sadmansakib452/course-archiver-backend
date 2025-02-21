import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from './minio.service';
import { UploadFixedFileDto } from './dto/upload-file.dto';
import { CourseFileResponse } from './interfaces/file-data.interface';
import { FileStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UploadDynamicFileDto } from './dto/upload-dynamic-file.dto';

// Add interface for file data
interface FileDataUpload {
  url: string;
  version: number;
  updatedAt: Date;
  hash: string;
  approvedAt: Date | null;
  comments?: string;
}

// Add interface for dynamic file
interface DynamicFileData {
  name: string;
  fileData: FileDataUpload;
}

// Fixed type for existing file
type ExistingFileType = {
  // Fixed file fields
  attendanceSheet?: FileDataUpload | null;
  finalGrades?: FileDataUpload | null;
  summaryObe?: FileDataUpload | null;
  insFeedback?: FileDataUpload | null;
  courseOutline?: FileDataUpload | null;
  assignment?: FileDataUpload | null;
  labExperiment?: FileDataUpload | null;

  // Dynamic file fields
  customFiles?: DynamicFileData[];
  miscFiles?: DynamicFileData[];

  // Required fields
  courseId: string;
  userId: string;
};

@Injectable()
export class CourseFilesService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private configService: ConfigService,
  ) {}

  async uploadFixedFile(
    courseId: string,
    file: Express.Multer.File,
    dto: UploadFixedFileDto,
    userId: string,
  ): Promise<CourseFileResponse> {
    try {
      // Type guard for file
      if (!this.isValidFile(file)) {
        throw new BadRequestException('Invalid file data');
      }

      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Generate file hash
      const hash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Create file path
      const filePath = `${courseId}/${dto.fileType}/${file.originalname}`;
      const bucketName =
        this.configService.get<string>('MINIO_BUCKET') || 'course-files';

      // Upload to MinIO and get URL
      const url = await this.minioService.uploadFile(file, filePath);

      // Generate presigned URL for immediate access
      const accessUrl = await this.minioService.getPresignedUrl(
        bucketName,
        filePath,
      );

      // Prepare file data with proper typing
      const fileData: FileDataUpload = {
        url: accessUrl,
        version: 1,
        updatedAt: new Date(),
        hash,
        approvedAt: null,
        comments: dto.comments,
      };

      // For version tracking, check if file exists
      const existingFile = (await this.prisma.courseFiles.findFirst({
        where: { courseId, userId },
      })) as ExistingFileType | null;

      if (existingFile && existingFile[dto.fileType]) {
        const currentFile = existingFile[dto.fileType];
        fileData.version = (currentFile?.version || 0) + 1;
        fileData.approvedAt = currentFile?.approvedAt ?? null;
      }

      // Update or create course files record
      const courseFiles = await this.prisma.courseFiles.upsert({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
        create: {
          courseId,
          userId,
          status: FileStatus.PENDING,
          [dto.fileType]: fileData,
        },
        update: {
          [dto.fileType]: {
            ...fileData,
            approvedAt: null,
          },
          status: FileStatus.PENDING,
        },
      });

      // Transform response to match interface
      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: courseFiles.id,
          courseId: courseFiles.courseId,
          userId: courseFiles.userId,
          status: courseFiles.status,
          semester: courseFiles.semester?.toString(),
          year: courseFiles.year || undefined,
          comments: courseFiles.comments || undefined,
          [dto.fileType]: fileData,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('Malformed ObjectID')
      ) {
        throw new BadRequestException('Invalid user or course ID format');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to upload file: ${message}`);
    }
  }

  async uploadDynamicFile(
    courseId: string,
    file: Express.Multer.File,
    dto: UploadDynamicFileDto,
    userId: string,
  ): Promise<CourseFileResponse> {
    try {
      if (!this.isValidFile(file)) {
        throw new BadRequestException('Invalid file data');
      }

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      const hash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      const filePath = `${courseId}/${dto.type}/${dto.name}/${file.originalname}`;
      const bucketName =
        this.configService.get<string>('MINIO_BUCKET') || 'course-files';

      const url = await this.minioService.uploadFile(file, filePath);
      const accessUrl = await this.minioService.getPresignedUrl(
        bucketName,
        filePath,
      );

      const fileData: FileDataUpload = {
        url: accessUrl,
        version: 1,
        updatedAt: new Date(),
        hash,
        approvedAt: null,
        comments: dto.comments,
      };

      // Get existing files
      const existingFile = (await this.prisma.courseFiles.findFirst({
        where: { courseId, userId },
      })) as ExistingFileType | null;

      // Prepare dynamic files update
      const dynamicFileField =
        dto.type === 'custom' ? 'customFiles' : 'miscFiles';
      let existingFiles = (existingFile?.[dynamicFileField] ||
        []) as DynamicFileData[];
      const fileIndex = existingFiles.findIndex((f) => f.name === dto.name);

      if (fileIndex >= 0) {
        // Update existing file
        fileData.version = (existingFiles[fileIndex].fileData.version || 0) + 1;
        existingFiles[fileIndex] = { name: dto.name, fileData };
      } else {
        // Add new file
        existingFiles = [...existingFiles, { name: dto.name, fileData }];
      }

      // Update database
      const courseFiles = await this.prisma.courseFiles.upsert({
        where: {
          courseId_userId: { courseId, userId },
        },
        create: {
          courseId,
          userId,
          status: FileStatus.PENDING,
          [dynamicFileField]: existingFiles,
        },
        update: {
          [dynamicFileField]: existingFiles,
          status: FileStatus.PENDING,
        },
      });

      return {
        success: true,
        message: 'Dynamic file uploaded successfully',
        data: {
          id: courseFiles.id,
          courseId: courseFiles.courseId,
          userId: courseFiles.userId,
          status: courseFiles.status,
          [dynamicFileField]: existingFiles,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('Malformed ObjectID')
      ) {
        throw new BadRequestException('Invalid user or course ID format');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to upload file: ${message}`);
    }
  }

  private isValidFile(file: any): file is Express.Multer.File {
    return (
      file &&
      typeof file === 'object' &&
      'buffer' in file &&
      'originalname' in file
    );
  }
}
