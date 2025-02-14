import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserStatus, UserRole, Prisma } from '@prisma/client';
import { ArchiveUserDto } from './dto/archive-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { AuditService } from '../../common/services/audit.service';
import {
  InvalidUserStatusException,
  UserStatusUpdateForbiddenException,
} from './exceptions/user.exceptions';
import {
  ArchivedUserResponse,
  StatusUpdateResponse,
  ArchiveUserResponse,
  SoftDeleteResponse,
} from './interfaces/user-response.interface';
import { USER_ACTIVITIES } from './constants/activity.constants';
import { UserActivityService } from './services/activity.service';
import { ListUsersDto } from './dto/list-users.dto';
import { ListUsersResponseDto } from './dto/responses/user-response.dto';
import { PermanentDeleteUserDto } from './dto/permanent-delete-user.dto';
import { UserActionResponseDto } from './dto/responses/user-action-response.dto';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
    private activityService: UserActivityService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updates: Partial<{
      name: string;
      password: string;
    }> = {};

    if (updateProfileDto.name) {
      updates.name = updateProfileDto.name;
    }

    if (updateProfileDto.newPassword) {
      if (!updateProfileDto.currentPassword) {
        throw new InvalidUserStatusException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Current password is required to set new password',
        });
      }

      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new InvalidUserStatusException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Current password is incorrect',
        });
      }

      const salt = await bcrypt.genSalt(
        this.configService.get<number>('env.passwordSaltRounds'),
      );
      updates.password = await bcrypt.hash(updateProfileDto.newPassword, salt);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async updateUserStatus(
    userId: string,
    currentUserId: string,
    dto: UpdateUserStatusDto,
  ): Promise<StatusUpdateResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status === UserStatus.ARCHIVED) {
        throw new UserStatusUpdateForbiddenException();
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { status: dto.status },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          department: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.activityService.logActivity({
        userId,
        action: USER_ACTIVITIES.STATUS_CHANGE,
        details: {
          oldStatus: user.status,
          newStatus: dto.status,
          updatedBy: currentUserId,
        },
      });

      return {
        message: 'User status updated successfully',
        user: updatedUser,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Operation failed:', error);
      throw new Error(error);
    }
  }

  async archiveUser(
    userId: string,
    currentUserId: string,
    dto: ArchiveUserDto,
  ): Promise<UserActionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.ARCHIVED) {
      throw new UserStatusUpdateForbiddenException();
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ARCHIVED,
        archivedAt: new Date(),
        archivedBy: currentUserId,
        archivedReason: dto.reason,
      },
    });

    return {
      success: true,
      message: 'User archived successfully',
      timestamp: new Date(),
      userId,
      actionTimestamp: new Date(),
    };
  }

  async getArchivedUsers(
    departmentCode: string,
  ): Promise<ArchivedUserResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ARCHIVED,
        department: departmentCode,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        archivedReason: true,
        archivedByUser: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // Transform and ensure type safety
    return users.map((user) => ({
      ...user,
      archivedBy: user.archivedByUser || null,
      archivedByUser: undefined,
    })) as ArchivedUserResponse[];
  }

  async softDeleteUser(
    userId: string,
    currentUserId: string,
  ): Promise<SoftDeleteResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        email: true,
        name: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete super admin user');
    }

    if (user.deletedAt !== null || user.status === UserStatus.ARCHIVED) {
      throw new ForbiddenException('User is already deleted');
    }

    const updatedUser = await this.prisma.$transaction(async (prisma) => {
      const deleted = await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ARCHIVED,
          deletedAt: new Date(),
          deletedBy: currentUserId,
          deletedReason: 'User deleted by admin',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          department: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          deletedReason: true,
          deletedByUser: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      });

      await this.activityService.logActivity({
        userId,
        action: USER_ACTIVITIES.DELETE,
        details: {
          deletedBy: currentUserId,
          timestamp: new Date(),
        },
      });

      return deleted;
    });

    return {
      message: 'User deleted successfully',
      user: {
        ...updatedUser,
        deletedBy: updatedUser.deletedByUser,
      },
    };
  }

  async restoreUser(userId: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        name: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.deletedAt === null || user.status !== UserStatus.ARCHIVED) {
      throw new ForbiddenException('User is not deleted');
    }

    const restoredUser = await this.prisma.$transaction(async (prisma) => {
      const restored = await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.INACTIVE,
          deletedAt: null,
          deletedBy: null,
          deletedReason: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          department: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.activityService.logActivity({
        userId,
        action: USER_ACTIVITIES.RESTORE,
        details: {
          restoredBy: currentUserId,
          timestamp: new Date(),
        },
      });

      return restored;
    });

    return {
      message: 'User restored successfully',
      user: restoredUser,
    };
  }

  async getAllUsers(filters: ListUsersDto): Promise<ListUsersResponseDto> {
    const where: Prisma.UserWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.role && { role: filters.role }),
      ...(filters.department && { department: filters.department }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
    };

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      timestamp: new Date(),
      data: users,
      total: users.length,
    };
  }

  async permanentDeleteUser(
    userId: string,
    dto: PermanentDeleteUserDto,
    adminId: string,
  ): Promise<UserActionResponseDto> {
    // Verify user exists and can be deleted
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete super admin user');
    }

    // Use transaction for atomic operation
    return await this.prisma.$transaction(async (prisma) => {
      // Log the deletion activity first
      await this.activityService.logActivity({
        userId,
        action: USER_ACTIVITIES.PERMANENT_DELETE,
        details: {
          deletedBy: adminId,
          reason: dto.reason,
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date(),
        },
      });

      // Delete related data
      await Promise.all([
        // Delete user activities
        prisma.userActivity.deleteMany({
          where: { userId },
        }),
        // Delete refresh tokens
        prisma.refreshToken.deleteMany({
          where: { userId },
        }),
        // Delete password reset tokens
        prisma.passwordReset.deleteMany({
          where: { userId },
        }),
      ]);

      // Finally delete the user
      await prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'User permanently deleted',
        timestamp: new Date(),
        userId,
        actionTimestamp: new Date(),
      };
    });
  }
}
