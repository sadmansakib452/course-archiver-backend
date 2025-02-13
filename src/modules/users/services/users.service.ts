import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserActivityService } from './activity.service';
import { UserStatus, UserRole } from '@prisma/client';
import { USER_ACTIVITIES } from '../constants/activity.constants';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private activityService: UserActivityService,
  ) {}

  async softDeleteUser(userId: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete super admin user');
    }

    if (user.status === UserStatus.ARCHIVED) {
      throw new ForbiddenException('User is already archived/deleted');
    }

    const updatedUser = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ARCHIVED,
          deletedAt: new Date(),
          deletedBy: currentUserId,
          deletedReason: 'User deleted by admin',
        },
        include: {
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
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    return {
      message: 'User deleted successfully',
      user: {
        ...updatedUser,
        deletedBy: updatedUser.deletedByUser,
        deletedByUser: undefined,
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ARCHIVED) {
      throw new ForbiddenException('User is not deleted/archived');
    }

    // Use transaction for consistency
    const restoredUser = await this.prisma.$transaction(async (prisma) => {
      const restored = await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.INACTIVE,
          deletedAt: null,
          deletedBy: null,
          deletedReason: null,
        },
      });

      await this.activityService.logActivity({
        userId,
        action: USER_ACTIVITIES.RESTORE,
        details: {
          restoredBy: currentUserId,
          userName: user.name,
          userEmail: user.email,
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
}
