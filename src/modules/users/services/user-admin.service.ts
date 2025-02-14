import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserActivityService } from './activity.service';
import { UserRole, UserStatus } from '@prisma/client';
import { USER_ACTIVITIES } from '../constants/activity.constants';
import {
  ErrorCode,
  ErrorMessages,
} from '../../../common/constants/error-codes';
import { ListUsersDto } from '../dto/list-users.dto';
import { ListUsersResponseDto } from '../dto/responses/user-response.dto';
import { PermanentDeleteUserDto } from '../dto/permanent-delete-user.dto';
import { CacheService } from '../../../common/services/cache.service';
import {
  UserNotFoundException,
  SuperAdminModificationException,
} from '../exceptions/user.exceptions';
import { Prisma } from '@prisma/client';
import { UserActionResponseDto } from '../dto/responses/user-action-response.dto';

@Injectable()
export class UserAdminService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly USERS_CACHE_KEY = 'users:list';

  constructor(
    private prisma: PrismaService,
    private activityService: UserActivityService,
    private cacheService: CacheService,
  ) {}

  async softDeleteUser(
    userId: string,
    adminId: string,
  ): Promise<UserActionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminModificationException('deletion');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.INACTIVE,
        deletedAt: new Date(),
        deletedBy: adminId,
      },
    });

    return {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date(),
      userId,
      actionTimestamp: new Date(),
    };
  }

  async restoreUser(
    userId: string,
    adminId: string,
  ): Promise<UserActionResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        deletedAt: null,
        deletedBy: null,
      },
    });

    return {
      success: true,
      message: 'User restored successfully',
      timestamp: new Date(),
      userId,
      actionTimestamp: new Date(),
    };
  }

  async getAllUsers(filters: ListUsersDto): Promise<ListUsersResponseDto> {
    const where: Prisma.UserWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.role && { role: filters.role }),
      ...(filters.department && { department: filters.department }),
      ...(filters.search && {
        OR: [
          {
            name: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            email: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    const users = await this.prisma.user.findMany({
      where,
      orderBy: {
        [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
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
  ) {
    // First validate if user exists and can be deleted
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminModificationException('permanent deletion');
    }

    // Perform deletion in transaction
    return await this.prisma.$transaction(async (prisma) => {
      // Delete the user
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log the deletion activity
      await this.activityService.logActivity({
        userId: adminId,
        action: USER_ACTIVITIES.PERMANENT_DELETE,
        details: {
          deletedUserId: userId,
          userName: user.name,
          reason: dto.reason,
          timestamp: new Date(),
        },
      });

      // Invalidate cache
      await this.invalidateUserCaches(userId);

      return {
        success: true,
        message: 'User permanently deleted',
        timestamp: new Date(),
        userId,
        actionTimestamp: new Date(),
      };
    });
  }

  private async invalidateUserCaches(userId: string) {
    await this.cacheService.del(`user_profile:${userId}`);
    await this.cacheService.del(this.USERS_CACHE_KEY);
  }
}
