import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateDto } from './dto/template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { TemplateStatsDto } from './dto/template-stats.dto';
import { SearchTemplateDto } from './dto/search-template.dto';
import { Prisma } from '@prisma/client';

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
    } catch (_error) {
      throw new BadRequestException('Failed to create template');
    }
  }

  async listTemplates({
    status = undefined,
    page = 1,
    limit = 10,
  }: {
    status?: boolean;
    page?: number;
    limit?: number;
  }) {
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status !== undefined) {
      where['status'] = Boolean(status);
    }

    const [templates, total] = await Promise.all([
      this.prisma.fileTemplate.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.fileTemplate.count({
        where,
      }),
    ]);

    return {
      success: true,
      data: templates.map((template) => TemplateDto.fromEntity(template)),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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
    } catch (_error) {
      throw new NotFoundException('Template not found');
    }
  }

  async deleteTemplate(id: string) {
    try {
      // First delete all related template usages
      await this.prisma.templateUsage.deleteMany({
        where: { templateId: id },
      });

      // Then delete the template
      await this.prisma.fileTemplate.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      // Log error but don't expose internal details
      console.error('Delete template error:', error);
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

    if (!template.data) {
      throw new NotFoundException('Template data not found');
    }

    const [usageCount, recentUsage] = await Promise.all([
      this.prisma.templateUsage.count({
        where: { templateId: id },
      }),
      this.prisma.templateUsage.findMany({
        where: { templateId: id },
        orderBy: { usedAt: 'desc' },
        take: 5,
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          user: true,
        },
      }),
    ]);

    return {
      id: template.data.id,
      name: template.data.name,
      description: template.data.description,
      status: template.data.status,
      maxSize: template.data.maxSize,
      createdAt: template.data.createdAt,
      updatedAt: template.data.updatedAt,
      templateId: id,
      usageCount,
      recentUsage: recentUsage.map((usage) => ({
        courseId: usage.courseId,
        courseName: usage.course.name,
        courseCode: usage.course.code,
        userId: usage.userId,
        userName: usage.user.name,
        usedAt: usage.usedAt,
      })),
      isRequired: template.data.isRequired ?? false,
      fileTypes: template.data.fileTypes ?? [],
      createdBy: template.data.createdBy,
    };
  }

  async searchTemplates(searchDto: SearchTemplateDto) {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    const where: Prisma.FileTemplateWhereInput = {
      AND: [] as Prisma.FileTemplateWhereInput[],
    };

    if (search) {
      (where.AND as Prisma.FileTemplateWhereInput[]).push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status !== undefined) {
      (where.AND as Prisma.FileTemplateWhereInput[]).push({
        status: status === 'true',
      });
    }

    if ((where.AND as Prisma.FileTemplateWhereInput[]).length === 0) {
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
        usageCount: template._count?.usages || 0,
      })),
    };
  }
}
