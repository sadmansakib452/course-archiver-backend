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
import { FileTemplatesService } from '../admin/file-templates/file-templates.service';
import { FileTemplate } from '@prisma/client';
import { TemplateUsageService } from './services/template-usage.service';
import { MultipleExamResponse } from './dto/exam-response.dto';
import { ExamType, ExamFileType } from './dto/exam-file.dto';
import { ExamSetUploadDto } from './dto/exam-set-upload.dto';
import { ExamUploadResult } from './interfaces/exam-upload.interface';

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

// 1. Add type guard for template
interface ValidTemplate {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  fileTypes: string[];
  maxSize: number;
  status: boolean;
  createdBy: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Add at the top with other interfaces
interface ExamRecord {
  id: string;
  examNumber?: number;
  quizNumber?: number;
  isCompleted: boolean;
}

@Injectable()
export class CourseFilesService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private configService: ConfigService,
    private fileTemplatesService: FileTemplatesService,
    private templateUsageService: TemplateUsageService,
  ) {}

  // 1. First, create a type-safe file accessor
  private getFileData(file: Express.Multer.File): {
    buffer: Buffer;
    originalname: string;
  } {
    if (!this.isValidFile(file)) {
      throw new BadRequestException('Invalid file data');
    }

    // Type assertion after validation
    const validatedFile = file as { buffer: Buffer; originalname: string };
    return {
      buffer: validatedFile.buffer,
      originalname: validatedFile.originalname,
    };
  }

  async uploadFixedFile(
    courseId: string,
    file: Express.Multer.File,
    dto: UploadFixedFileDto,
    userId: string,
  ): Promise<CourseFileResponse> {
    try {
      const { buffer, originalname } = this.getFileData(file);

      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Generate file hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Create file path
      const filePath = `${courseId}/${dto.fileType}/${originalname}`;

      // Upload to MinIO and get URL
      const accessUrl = await this.minioService.uploadFile(
        { ...file, buffer, originalname },
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

  // 2. Use type guard in methods
  async getTemplate(templateId: string): Promise<ValidTemplate | undefined> {
    const template = await this.prisma.fileTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !this.isValidTemplate(template)) {
      return undefined;
    }

    return template;
  }

  // Add helper method for file type checking
  private getFileExtension(mimetype: string): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
    };
    return mimeMap[mimetype] ?? '';
  }

  async uploadDynamicFile(
    courseId: string,
    file: Express.Multer.File,
    dto: UploadDynamicFileDto,
    userId: string,
  ): Promise<CourseFileResponse> {
    try {
      console.log('File mimetype:', file.mimetype);
      console.log('Template ID:', dto.templateId);
      console.log('File size:', file.size);

      const { buffer, originalname } = this.getFileData(file);

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      const filePath = `${courseId}/${dto.type}/${dto.name}/${originalname}`;

      const accessUrl = await this.minioService.uploadFile(
        { ...file, buffer, originalname },
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
      let existingFiles: DynamicFileData[] =
        existingFile?.[dynamicFileField] || [];
      const fileIndex = existingFiles.findIndex((f) => f.name === dto.name);

      if (fileIndex >= 0) {
        // Update existing file
        fileData.version = (existingFiles[fileIndex].fileData.version || 0) + 1;
        existingFiles[fileIndex] = { name: dto.name, fileData };
      } else {
        // Add new file
        existingFiles = [...existingFiles, { name: dto.name, fileData }];
      }

      // Get template first if provided
      const template = dto.templateId
        ? await this.getTemplate(dto.templateId)
        : undefined;

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

      // Validate template first if provided
      if (dto.templateId) {
        try {
          const template = await this.prisma.fileTemplate.findUnique({
            where: { id: dto.templateId },
          });

          if (!template) {
            throw new NotFoundException('Template not found');
          }

          // Validate file type using extension
          const fileExt = this.getFileExtension(file.mimetype);
          if (!template.fileTypes.includes(fileExt)) {
            throw new BadRequestException(
              `File type not allowed. Allowed types: ${template.fileTypes.join(', ')}`,
            );
          }

          // Validate file size
          if (template.maxSize && file.size > template.maxSize) {
            throw new BadRequestException('File size exceeds template limit');
          }
        } catch (error) {
          if (
            error instanceof NotFoundException ||
            error instanceof BadRequestException
          ) {
            throw error;
          }
          throw new BadRequestException('Template validation failed');
        }
      }

      // Track template usage if template was used
      if (dto.templateId && courseFiles.id) {
        await this.templateUsageService.trackUsage({
          templateId: dto.templateId,
          courseId,
          userId,
          fileId: courseFiles.id,
        });
      }

      return {
        success: true,
        message: 'Dynamic file uploaded successfully',
        data: {
          id: courseFiles.id,
          courseId: courseFiles.courseId,
          userId: courseFiles.userId,
          status: courseFiles.status,
          [dynamicFileField]: existingFiles,
          template: template || undefined,
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

  private isValidFile(file: unknown): file is Express.Multer.File {
    if (!file || typeof file !== 'object') return false;

    const typedFile = file as { buffer?: unknown; originalname?: unknown };

    return (
      Buffer.isBuffer(typedFile.buffer) &&
      typeof typedFile.originalname === 'string'
    );
  }

  // Add type guard for template
  private isValidTemplate(template: unknown): template is ValidTemplate {
    if (!template || typeof template !== 'object') return false;

    const t = template as ValidTemplate;
    return (
      typeof t.id === 'string' &&
      typeof t.name === 'string' &&
      (t.description === null || typeof t.description === 'string') &&
      typeof t.isRequired === 'boolean' &&
      Array.isArray(t.fileTypes) &&
      typeof t.maxSize === 'number' &&
      typeof t.status === 'boolean' &&
      typeof t.createdBy === 'string' &&
      typeof t.userId === 'string' &&
      t.createdAt instanceof Date &&
      t.updatedAt instanceof Date
    );
  }

  async getAvailableTemplates(): Promise<FileTemplate[]> {
    return this.prisma.fileTemplate.findMany({
      where: {
        status: true, // Only active templates
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async validateTemplateRequirements(
    templateId: string,
    fileSize: number,
    fileType: string,
  ) {
    const template = await this.getTemplate(templateId);

    if (!template) {
      return {
        success: false,
        message: 'Template not found',
      };
    }

    return {
      success: true,
      isValid:
        template.fileTypes.includes(fileType) &&
        (!template.maxSize || fileSize <= template.maxSize),
      requirements: {
        fileTypes: template.fileTypes,
        maxSize: template.maxSize,
        isRequired: template.isRequired,
      },
    };
  }

  async uploadExamFiles(
    courseId: string,
    files: { [key: string]: Express.Multer.File[] },
    dto: ExamSetUploadDto,
    userId: string,
  ): Promise<MultipleExamResponse> {
    try {
      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Get or create CourseFiles record
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
        },
        update: {},
      });

      const examResults: ExamUploadResult[] = [];

      // Process each set
      for (const setNumber of [1, 2]) {
        const setFiles = this.getSetFiles(files, setNumber);
        if (Object.keys(setFiles).length > 0) {
          const result = await this.processExamSet(
            courseFiles.id,
            setFiles,
            dto.examType,
            setNumber,
            courseId,
          );
          examResults.push(result);
        }
      }

      return {
        success: true,
        message: 'Exam files uploaded successfully',
        data: {
          courseId,
          exams: examResults,
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to upload exam files: ${error.message}`,
        );
      }
      throw new BadRequestException('Failed to upload exam files');
    }
  }

  private getSetFiles(
    files: { [key: string]: Express.Multer.File[] },
    setNumber: number,
  ): { [key: string]: Express.Multer.File } {
    const setFiles: { [key: string]: Express.Multer.File } = {};
    const fileTypes = Object.values(ExamFileType);

    fileTypes.forEach((type) => {
      const key = `${type}_${setNumber}`;
      if (files[key]?.[0]) {
        setFiles[type] = files[key][0];
      }
    });

    return setFiles;
  }

  private async processExamSet(
    courseFilesId: string,
    files: { [key: string]: Express.Multer.File },
    examType: ExamType,
    setNumber: number,
    courseId: string,
  ): Promise<ExamUploadResult> {
    const examFiles: Record<string, FileDataUpload> = {};

    // Process each file
    for (const [fileType, file] of Object.entries(files)) {
      const { buffer, originalname } = this.getFileData(file);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const filePath = `${courseId}/exams/${examType}/${setNumber}/${fileType}/${originalname}`;

      const url = await this.minioService.uploadFile(
        { ...file, buffer, originalname },
        filePath,
      );

      examFiles[fileType] = {
        url,
        version: 1,
        updatedAt: new Date(),
        hash,
        approvedAt: null,
      };
    }

    // Create or update exam record
    const examData = {
      courseFilesId,
      ...examFiles,
      isCompleted: this.isExamComplete(examFiles),
    };

    const exam = await this.prisma.midExam.upsert({
      where: {
        courseFilesId_examNumber: {
          courseFilesId,
          examNumber: setNumber,
        },
      },
      create: {
        ...examData,
        examNumber: setNumber,
      },
      update: examData,
    });

    return {
      examId: exam.id,
      examNumber: setNumber,
      uploadedFiles: Object.keys(examFiles),
      pendingFiles: Object.values(ExamFileType).filter(
        (type) => !Object.keys(examFiles).includes(type),
      ),
      isComplete: this.isExamComplete(examFiles),
    };
  }

  /**
   * Check if all required exam components are present
   *
   * @param files - Object containing exam file components
   * @returns boolean indicating if all required components are present
   */
  private isExamComplete(
    files: Partial<Record<ExamFileType, FileDataUpload>>,
  ): boolean {
    return Object.values(ExamFileType).every((type) => files[type]);
  }
}
