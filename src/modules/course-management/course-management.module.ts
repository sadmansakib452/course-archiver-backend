import { Module } from '@nestjs/common';
import { CourseManagementController } from './course-management.controller';
import { CourseManagementService } from './course-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseManagementController],
  providers: [CourseManagementService],
})
export class CourseManagementModule {}
