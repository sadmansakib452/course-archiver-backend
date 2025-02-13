import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ActivityFilterDto } from '../dto/activity/activity-filter.dto';
import {
  ActivityReportDto,
  ReportType,
} from '../dto/activity/activity-report.dto';

@Injectable()
export class UserActivityService {
  constructor(private prisma: PrismaService) {}

  async logActivity(data: {
    userId: string;
    action: string;
    details: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    return this.prisma.userActivity.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress,
      },
    });
  }

  async getUserActivities(
    userId: string,
    page = 1,
    limit = 10,
    filter?: ActivityFilterDto,
  ) {
    const where: Prisma.UserActivityWhereInput = {
      userId,
      ...(filter?.startDate && {
        createdAt: {
          gte: new Date(filter.startDate),
        },
      }),
      ...(filter?.endDate && {
        createdAt: {
          lte: new Date(filter.endDate),
        },
      }),
      ...(filter?.action && {
        action: filter.action,
      }),
      ...(filter?.search && {
        OR: [
          {
            details: {
              equals: { $regex: filter.search, $options: 'i' },
            },
          },
          {
            user: {
              name: {
                contains: filter.search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    };

    const [activities, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.userActivity.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async generateActivityReport(dto: ActivityReportDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    let endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Adjust dates based on report type
    switch (dto.type) {
      case ReportType.DAILY:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case ReportType.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case ReportType.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const where: Prisma.UserActivityWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(dto.action && { action: dto.action }),
    };

    const activities = await this.prisma.userActivity.groupBy({
      by: ['action'],
      where,
      _count: true,
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: activities.map((item) => ({
        action: item.action,
        count: item._count,
        firstOccurrence: item._min.createdAt,
        lastOccurrence: item._max.createdAt,
      })),
      total: activities.reduce((acc, curr) => acc + curr._count, 0),
    };
  }

  async exportActivities(userId: string, format: 'CSV' | 'PDF') {
    // Implementation
  }
}
