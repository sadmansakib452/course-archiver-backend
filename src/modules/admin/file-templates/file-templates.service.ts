import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateDto } from './dto/template.dto';
import {
  TemplateResponseDto,
  TemplateListResponseDto,
} from './dto/template-response.dto';
import { TemplateStatsDto } from './dto/template-stats.dto';
import { SearchTemplateDto } from './dto/search-template.dto';

@Injectable()
export class FileTemplatesService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(
    dto: CreateTemplateDto,
    userId: string,
  ): Promise<TemplateResponseDto> {
    try {
      const template = await this.prisma.fileTemplate.create({
        data: {
          ...dto,
          maxSize: dto.maxSize || 10 * 1024 * 1024, // Default 10MB
          createdBy: userId,
        },
      });

      return {
        success: true,
        message: 'Template created successfully',
        data: TemplateDto.fromEntity(template),
      };
    } catch (error) {
      throw new BadRequestException('Failed to create template');
    }
  }

  async listTemplates({ 
    department, 
    status,
    page = 1,
    limit = 10,
  }: {
    department?: string;
    status?: boolean;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      this.prisma.fileTemplate.findMany({
        where: {
          ...(department && { department }),
          ...(status !== undefined && { status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.fileTemplate.count({
        where: {
          ...(department && { department }),
          ...(status !== undefined && { status }),
        },
      }),
    ]);

    return {
      success: true,
      data: templates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplate(id: string): Promise<TemplateResponseDto> {
    const template = await this.prisma.fileTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return {
      success: true,
      message: 'Template retrieved successfully',
      data: TemplateDto.fromEntity(template),
    };
  }

  async updateTemplate(
    id: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    try {
      const template = await this.prisma.fileTemplate.update({
        where: { id },
        data: dto,
      });

      return {
        success: true,
        message: 'Template updated successfully',
        data: TemplateDto.fromEntity(template),
      };
    } catch (error) {
      throw new NotFoundException('Template not found');
    }
  }

  async deleteTemplate(id: string) {
    try {
      await this.prisma.fileTemplate.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      throw new NotFoundException('Template not found');
    }
  }

  async toggleStatus(id: string): Promise<TemplateResponseDto> {
    const template = await this.prisma.fileTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const updatedTemplate = await this.prisma.fileTemplate.update({
      where: { id },
      data: {
        status: !template.status,
      },
    });

    return {
      success: true,
      message: `Template ${updatedTemplate.status ? 'activated' : 'deactivated'} successfully`,
      data: TemplateDto.fromEntity(updatedTemplate),
    };
  }

  async getTemplateStats(id: string): Promise<TemplateStatsDto> {
    const template = await this.getTemplate(id);

    const [usageCount, recentUsage] = await Promise.all([
      this.prisma.templateUsage.count({
        where: { templateId: id },
      }),
      this.prisma.templateUsage.findMany({
        where: { templateId: id },
        orderBy: { usedAt: 'desc' },
        take: 5,
        include: {
          course: true,
          user: true,
        },
      }),
    ]);

    return {
      templateId: id,
      usageCount,
      recentUsage: recentUsage.map((usage) => ({
        courseId: usage.courseId,
        courseName: usage.course.name,
        userId: usage.userId,
        userName: usage.user.name,
        usedAt: usage.usedAt,
      })),
    };
  }

  async getDepartmentStats(department: string) {
    const templates = await this.prisma.fileTemplate.findMany({
      where: { department },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    return {
      department,
      totalTemplates: templates.length,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        usageCount: t._count.usages,
      })),
    };
  }

  async searchTemplates(searchDto: SearchTemplateDto) {
    const {
      search,
      department,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    // Build where conditions
    const where: any = {
      AND: [],
    };

    // Add search condition if provided
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Add department filter if provided
    if (department) {
      where.AND.push({ department });
    }

    // Add status filter if provided - convert string to boolean
    if (status !== undefined) {
      where.AND.push({ status: status === 'true' });
    }

    // If no conditions, remove AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const templates = await this.prisma.fileTemplate.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    return {
      success: true,
      data: templates.map((template) => ({
        ...TemplateDto.fromEntity(template),
        usageCount: template._count.usages,
      })),
    };
  }
}
