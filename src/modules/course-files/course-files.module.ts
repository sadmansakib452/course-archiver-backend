import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CourseFilesController } from './course-files.controller';
import { CourseFilesService } from './course-files.service';
import { MinioService } from './minio.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FileTemplatesModule } from '../admin/file-templates/file-templates.module';
import { TemplateUsageService } from './services/template-usage.service';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
    FileTemplatesModule,
  ],
  controllers: [CourseFilesController],
  providers: [CourseFilesService, MinioService, TemplateUsageService],
  exports: [CourseFilesService],
})
export class CourseFilesModule {}
