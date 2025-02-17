import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuditLogFilters } from './dto/audit-log-filters.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AdminResponse } from './responses/admin.response';
import { AuditLogResponse } from './responses/audit-log.response';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.temporaryPassword, salt);
    console.log("dto ", dto.temporaryPassword);
    console.log("dto ",dto.email);
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: UserRole.ADMIN,
        department: dto.departmentCode,
        isOAuthUser: false,
        googleId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Try to send welcome email, but don't fail if it doesn't work
    try {
      await this.mailService.sendAdminWelcomeEmail(
        dto.email,
        dto.name,
        dto.temporaryPassword,
      );
    } catch (error) {
      console.warn('Failed to send welcome email:', error.message);
      // Continue execution - the admin was still created successfully
    }

    return {
      ...admin,
      message:
        'Admin created successfully. Note: Welcome email could not be sent.',
      temporaryPassword: dto.temporaryPassword, // Include this so super admin can share it manually
    };
  }

  async listAdmins(): Promise<AdminResponse[]> {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    // In a real application, you might want to store these in a Settings table
    // For now, we'll just return the updated settings
    const settings = {
      ...dto,
      updatedAt: new Date(),
      updatedBy: 'system',
    };

    // You could also store these in environment variables or a configuration file
    process.env.DEPARTMENT_NAME =
      dto.departmentName || process.env.DEPARTMENT_NAME;
    process.env.DEPARTMENT_CODE =
      dto.departmentCode || process.env.DEPARTMENT_CODE;

    return settings;
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse[]> {
    const { userId, action, startDate, endDate } = filters;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { lte: new Date(endDate) } }),
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs as unknown as AuditLogResponse[];
  }

  async getSystemStats() {
    const [userStats, courseStats, storageStats] = await Promise.all([
      this.getUserStats(),
      this.getCourseStats(),
      this.getStorageStats(),
    ]);

    return {
      ...userStats,
      ...courseStats,
      ...storageStats,
    };
  }

  private async getUserStats() {
    const [totalUsers, activeUsers, adminCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          OR: [{ role: UserRole.FACULTY }, { role: UserRole.CHAIRPERSON }],
        },
      }),
      this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      }),
    ]);

    return { totalUsers, activeUsers, adminCount };
  }

  private async getCourseStats() {
    // Implement course statistics
    return {};
  }

  private async getStorageStats() {
    // Implement storage statistics
    return {};
  }
}
