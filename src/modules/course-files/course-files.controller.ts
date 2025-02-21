import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  Get,
  Query,
  NotFoundException,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CourseFilesService } from './course-files.service';
import { UploadFixedFileDto, FixedFileType } from './dto/upload-file.dto';
import { CourseFileResponse } from './interfaces/file-data.interface';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { User } from '@prisma/client';
import { UploadDynamicFileDto } from './dto/upload-dynamic-file.dto';
import { FileTemplate } from './interfaces/file-template.interface';
import { MultipleExamResponse } from './dto/exam-response.dto';
import { ExamSetUploadDto } from './dto/exam-set-upload.dto';

@ApiTags('Course Files')
@Controller('course-files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseFilesController {
  constructor(private readonly courseFilesService: CourseFilesService) {}

  @Post(':courseId/fixed')
  @ApiOperation({ summary: 'Upload a fixed file type' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'fileType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (PDF or Word)',
        },
        fileType: {
          enum: Object.values(FixedFileType),
          description: 'Type of fixed file',
        },
        comments: {
          type: 'string',
          description: 'Optional comments',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return cb(
            new BadRequestException('Only PDF and Word files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFixedFile(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFixedFileDto,
    @Req() req: Request & { user: User },
  ): Promise<CourseFileResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.courseFilesService.uploadFixedFile(
      courseId,
      file,
      dto,
      req.user.id,
    );
  }

  @Post(':courseId/dynamic')
  @ApiOperation({ summary: 'Upload a dynamic file (custom/misc)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PDF and Word files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDynamicFile(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDynamicFileDto,
    @Req() req: Request & { user: User },
  ): Promise<CourseFileResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.courseFilesService.uploadDynamicFile(
      courseId,
      file,
      dto,
      req.user.id,
    );
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available templates' })
  async getTemplates(): Promise<FileTemplate[]> {
    return this.courseFilesService.getAvailableTemplates();
  }

  @Get('templates/:id/requirements')
  @ApiOperation({ summary: 'Get template requirements' })
  async getTemplateRequirements(@Param('id') id: string) {
    const template = await this.courseFilesService.getTemplate(id);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return {
      fileTypes: template.fileTypes,
      maxSize: template.maxSize,
      isRequired: template.isRequired,
      description: template.description || undefined,
    };
  }

  @Get('templates/:id/validate')
  @ApiOperation({ summary: 'Validate file against template' })
  async validateFileTemplate(
    @Param('id') templateId: string,
    @Query('size') fileSize: number,
    @Query('type') fileType: string,
  ) {
    return this.courseFilesService.validateTemplateRequirements(
      templateId,
      fileSize,
      fileType,
    );
  }

  /**
   * Upload multiple exam files
   *
   * This endpoint allows uploading multiple files for different exam types (MID, QUIZ, FINAL).
   * Each exam can have up to 4 components: question, highest, average, and marginal papers.
   * Supports partial uploads and updates to existing exam files.
   *
   * @param courseId - The ID of the course
   * @param files - Object containing uploaded files categorized by type
   * @param dto - DTO containing exam metadata
   * @param req - Request object containing user information
   * @returns MultipleExamResponse containing upload status and results
   *
   * @example
   * POST /course-files/123/exams
   * Content-Type: multipart/form-data
   *
   * {
   *   "exams": [
   *     {
   *       "examType": "MID",
   *       "examNumber": 1,
   *       "files": {
   *         "question": [File],
   *         "highest": [File],
   *         "average": [File],
   *         "marginal": [File]
   *       }
   *     }
   *   ]
   * }
   */
  @Post(':courseId/exams')
  @ApiOperation({
    summary: 'Upload exam files',
    description: 'Upload single or multiple exam files with their components',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'question_1', maxCount: 1 },
      { name: 'highest_1', maxCount: 1 },
      { name: 'average_1', maxCount: 1 },
      { name: 'marginal_1', maxCount: 1 },
      { name: 'question_2', maxCount: 1 },
      { name: 'highest_2', maxCount: 1 },
      { name: 'average_2', maxCount: 1 },
      { name: 'marginal_2', maxCount: 1 },
    ]),
  )
  async uploadExamFiles(
    @Param('courseId') courseId: string,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() dto: ExamSetUploadDto,
    @Req() req: Request & { user: User },
  ): Promise<MultipleExamResponse> {
    if (!files || Object.keys(files).length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return await this.courseFilesService.uploadExamFiles(
      courseId,
      files,
      dto,
      req.user.id,
    );
  }
}
