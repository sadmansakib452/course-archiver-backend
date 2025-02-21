import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TemplateUsageService {
  constructor(private prisma: PrismaService) {}

  async trackUsage(data: {
    templateId: string;
    courseId: string;
    userId: string;
    fileId: string;
  }) {
    return this.prisma.templateUsage.create({
      data: {
        templateId: data.templateId,
        courseId: data.courseId,
        userId: data.userId,
        fileId: data.fileId,
      },
    });
  }

  async getTemplateStats(templateId: string) {
    const [usageCount, recentUsage] = await Promise.all([
      this.prisma.templateUsage.count({
        where: { templateId },
      }),
      this.prisma.templateUsage.findMany({
        where: { templateId },
        orderBy: { usedAt: 'desc' },
        take: 5,
        include: {
          course: true,
          user: true,
        },
      }),
    ]);

    return {
      usageCount,
      recentUsage,
    };
  }
}
