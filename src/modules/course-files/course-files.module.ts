import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CourseFilesController } from './course-files.controller';
import { CourseFilesService } from './course-files.service';
import { MinioService } from './minio.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [CourseFilesController],
  providers: [CourseFilesService, MinioService],
  exports: [CourseFilesService],
})
export class CourseFilesModule {}
