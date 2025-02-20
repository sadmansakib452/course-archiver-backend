import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CourseManagementService } from './course-management.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponse } from './interfaces/course.interface';
import { CourseResponseDto } from './dto/course-response.dto';
import { CourseDetailResponse } from './interfaces/course-detail.interface';
import { CourseDetailResponseDto } from './dto/course-detail-response.dto';
import { ListCourseDto } from './dto/list-course.dto';
import { CourseListResponse } from './interfaces/course-list.interface';
import { CourseListResponseDto } from './dto/course-list-response.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BulkAssignCoursesDto } from './dto/bulk-assign-courses.dto';
import { BulkAssignResponse } from './interfaces/bulk-assign.interface';
import { BulkAssignResponseDto } from './dto/bulk-assign-response.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';

@ApiTags('Course Management')
@Controller('course-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CourseManagementController {
  constructor(
    private readonly courseManagementService: CourseManagementService,
  ) {}

  @Post('courses')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponse> {
    return this.courseManagementService.createCourse(createCourseDto);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Course details retrieved successfully',
    type: CourseDetailResponseDto,
  })
  async getCourseById(@Param('id') id: string): Promise<CourseDetailResponse> {
    return this.courseManagementService.getCourseById(id);
  }

  @Get('courses')
  @ApiOperation({ summary: 'List all courses' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    type: CourseListResponseDto,
  })
  async listCourses(
    @Query() filters: ListCourseDto,
  ): Promise<CourseListResponse> {
    return this.courseManagementService.listCourses(filters);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponse> {
    const result = await this.courseManagementService.updateCourse(
      id,
      updateCourseDto,
    );
    return result;
  }

  @Post('courses/bulk-assign')
  @ApiOperation({ summary: 'Bulk assign courses to faculty' })
  @ApiResponse({
    status: 200,
    description: 'Courses assigned successfully',
    type: BulkAssignResponseDto,
  })
  async bulkAssignCourses(
    @Body() bulkAssignDto: BulkAssignCoursesDto,
  ): Promise<BulkAssignResponse> {
    return this.courseManagementService.bulkAssignCourses(bulkAssignDto);
  }

  @Patch('courses/:id/status')
  @ApiOperation({ summary: 'Update course status (activate/deactivate)' })
  @ApiResponse({
    status: 200,
    description: 'Course status updated successfully',
    type: CourseResponseDto,
  })
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCourseStatusDto,
  ): Promise<CourseResponse> {
    return this.courseManagementService.updateCourseStatus(id, updateStatusDto);
  }

  @Delete('courses/:id/permanent')
  @ApiOperation({ summary: 'Permanently delete a course' })
  @ApiResponse({
    status: 200,
    description: 'Course permanently deleted',
    type: CourseResponseDto,
  })
  async permanentDeleteCourse(
    @Param('id') id: string,
  ): Promise<CourseResponse> {
    const result = await this.courseManagementService.permanentDeleteCourse(id);
    return result;
  }
}
