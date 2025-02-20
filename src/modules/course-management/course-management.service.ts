import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponse } from './interfaces/course.interface';
import { CourseDetailResponse } from './interfaces/course-detail.interface';
import { Prisma } from '@prisma/client';
import { ListCourseDto } from './dto/list-course.dto';
import { CourseListResponse } from './interfaces/course-list.interface';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BulkAssignCoursesDto } from './dto/bulk-assign-courses.dto';
import { BulkAssignResponse } from './interfaces/bulk-assign.interface';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';

@Injectable()
export class CourseManagementService {
  private readonly logger = new Logger(CourseManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCourse(
    createCourseDto: CreateCourseDto,
  ): Promise<CourseResponse> {
    try {
      // Check for existing section
      const existingSection = await this.prisma.course.findFirst({
        where: {
          code: createCourseDto.code,
          section: createCourseDto.section,
          semester: createCourseDto.semester,
          year: createCourseDto.year,
        },
      });

      if (existingSection) {
        return {
          success: false,
          message: `Section ${createCourseDto.section} already exists for this course in ${createCourseDto.semester} ${createCourseDto.year}`,
        };
      }

      // If facultyId provided, verify faculty
      if (createCourseDto.facultyId) {
        const faculty = await this.prisma.facultyMember.findUnique({
          where: {
            id: createCourseDto.facultyId,
            isActive: true,
          },
        });

        if (!faculty) {
          return {
            success: false,
            message: 'Faculty member not found or inactive',
          };
        }
      }

      // Create course with proper type handling
      const courseData: Prisma.CourseUncheckedCreateInput = {
        code: createCourseDto.code,
        name: createCourseDto.name,
        section: createCourseDto.section,
        semester: createCourseDto.semester,
        year: createCourseDto.year,
        facultyId: createCourseDto.facultyId ?? null,
      };

      const course = await this.prisma.course.create({
        data: courseData,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              shortName: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Course created successfully',
        data: course,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create course: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return {
        success: false,
        message: 'Failed to create course',
      };
    }
  }

  async getCourseById(id: string): Promise<CourseDetailResponse> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              shortName: true,
            },
          },
        },
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found',
        };
      }

      return {
        success: true,
        message: 'Course retrieved successfully',
        data: course,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2023') {
          return {
            success: false,
            message: 'Invalid course ID format',
          };
        }
      }
      throw error;
    }
  }

  async listCourses(filters: ListCourseDto): Promise<CourseListResponse> {
    try {
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 10;
      const { search, semester, year, facultyId, sortBy, sortOrder, isActive } =
        filters;

      // Manual conversion of isActive if it's a string
      let isActiveBoolean: boolean | undefined = undefined;
      if (typeof isActive === 'string') {
        const lower = (isActive as string).toLowerCase();
        if (lower === 'true' || lower === '1') {
          isActiveBoolean = true;
        } else if (lower === 'false' || lower === '0') {
          isActiveBoolean = false;
        }
      } else {
        // If it's not a string, use it as is (could be boolean or undefined)
        isActiveBoolean = isActive;
      }

      const where: Prisma.CourseWhereInput = {
        ...(search && {
          OR: [
            {
              code: {
                contains: search,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          ],
        }),
        ...(semester && { semester }),
        ...(year && { year: Number(year) }),
        ...(facultyId && { facultyId }),
        ...(isActive !== undefined && { isActive: isActiveBoolean }),
      };

      console.log('Final where clause:', where);
      const total = await this.prisma.course.count({ where });
      console.log('Total count:', total);

      const activeCourses = await this.prisma.course.findMany({
        where: {
          isActive: true,
        },
      });

      console.log('Active courses:', activeCourses);

      const courses = await this.prisma.course.findMany({
        where,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              shortName: true,
            },
          },
        },
        skip: Math.max(0, (page - 1) * limit),
        take: Number(limit),
        orderBy: {
          [sortBy || 'createdAt']: (sortOrder || 'desc') as Prisma.SortOrder,
        },
      });

      return {
        success: true,
        message: 'Courses retrieved successfully',
        data: {
          courses,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to list courses: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return {
        success: false,
        message: 'Failed to list courses',
        data: {
          courses: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0,
          },
        },
      };
    }
  }

  async updateCourse(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponse> {
    try {
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        return {
          success: false,
          message: 'Course not found',
        };
      }

      // If section is being updated, check for duplicates
      if (updateCourseDto.section) {
        const sectionExists = await this.prisma.course.findFirst({
          where: {
            id: { not: id },
            code: updateCourseDto.code || existingCourse.code,
            section: updateCourseDto.section,
            semester: updateCourseDto.semester || existingCourse.semester,
            year: updateCourseDto.year || existingCourse.year,
          },
        });

        if (sectionExists) {
          return {
            success: false,
            message: `Section ${updateCourseDto.section} already exists for this course`,
          };
        }
      }

      // If facultyId provided, check if faculty exists
      if (updateCourseDto.facultyId) {
        const faculty = await this.prisma.facultyMember.findUnique({
          where: {
            id: updateCourseDto.facultyId,
            isActive: true,
          },
        });

        if (!faculty) {
          return {
            success: false,
            message: 'Faculty member not found or inactive',
          };
        }
      }

      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              shortName: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update course: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return {
        success: false,
        message: 'Failed to update course',
      };
    }
  }

  async bulkAssignCourses(
    bulkAssignDto: BulkAssignCoursesDto,
  ): Promise<BulkAssignResponse> {
    try {
      // Check if faculty exists and is active
      const faculty = await this.prisma.facultyMember.findUnique({
        where: {
          id: bulkAssignDto.facultyId,
          isActive: true,
        },
      });

      if (!faculty) {
        return {
          success: false,
          message: 'Faculty member not found or inactive',
        };
      }

      // Verify all courses exist
      const courses = await this.prisma.course.findMany({
        where: {
          id: { in: bulkAssignDto.courseIds },
        },
      });

      if (courses.length !== bulkAssignDto.courseIds.length) {
        return {
          success: false,
          message: 'One or more courses not found',
        };
      }

      // Update all courses in a transaction
      const updatedCourses = await this.prisma.$transaction(
        bulkAssignDto.courseIds.map((courseId) =>
          this.prisma.course.update({
            where: { id: courseId },
            data: { facultyId: bulkAssignDto.facultyId },
            include: {
              faculty: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  shortName: true,
                },
              },
            },
          }),
        ),
      );

      return {
        success: true,
        message: 'Courses assigned successfully',
        data: updatedCourses,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to bulk assign courses: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return {
        success: false,
        message: 'Failed to assign courses',
      };
    }
  }

  async updateCourseStatus(
    id: string,
    updateStatusDto: UpdateCourseStatusDto,
  ): Promise<CourseResponse> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found',
        };
      }

      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: {
          isActive: updateStatusDto.isActive,
        },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              shortName: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Course status updated successfully',
        data: updatedCourse,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update course status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return {
        success: false,
        message: 'Failed to update course status',
      };
    }
  }
}
