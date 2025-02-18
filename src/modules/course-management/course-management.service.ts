import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponse } from './interfaces/course.interface';
import { CourseDetailResponse } from './interfaces/course-detail.interface';
import { Prisma } from '@prisma/client';
import { ListCourseDto } from './dto/list-course.dto';
import { CourseListResponse } from './interfaces/course-list.interface';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class CourseManagementService {
  private readonly logger = new Logger(CourseManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCourse(
    createCourseDto: CreateCourseDto,
  ): Promise<CourseResponse> {
    try {
      // Check if faculty exists
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

      // Check if section already exists for this course in same semester/year
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

      // Create course
      const course = await this.prisma.course.create({
        data: createCourseDto,
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
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const { search, semester, year } = filters;

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(semester && { semester }),
      ...(year && { year: Number(year) }),
    };

    // Get total count
    const total = await this.prisma.course.count({ where });

    // Get courses with proper type conversion
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
        createdAt: 'desc',
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
}
