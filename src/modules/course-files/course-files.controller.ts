import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Req,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
  @ApiOperation({ summary: 'Get available templates for the department' })
  async getTemplates(
    @Query('department') department: string,
  ): Promise<FileTemplate[]> {
    return this.courseFilesService.getAvailableTemplates(department);
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

  @Get('templates/department/:department')
  @ApiOperation({ summary: 'Get templates by department' })
  async getTemplatesByDepartment(@Param('department') department: string) {
    return this.courseFilesService.getAvailableTemplates(department);
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
}
