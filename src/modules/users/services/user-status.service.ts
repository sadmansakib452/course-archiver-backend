import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { UserActivityService } from './activity.service';
import { USER_ACTIVITIES } from '../constants/activity.constants';
import { InvalidUserStatusException } from '../exceptions/user.exceptions';
import { ErrorCode } from '../../../common/constants/error-codes';
import { UserActionResponseDto } from '../dto/responses/user-action-response.dto';
import { UserStatus as UserStatusConstant } from '../../../common/constants/user-status';

@Injectable()
export class UserStatusService {
  private readonly allowedTransitions = {
    [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.ARCHIVED],
    [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.ARCHIVED],
    [UserStatus.ARCHIVED]: [UserStatus.INACTIVE],
  };

  constructor(
    private prisma: PrismaService,
    private activityService: UserActivityService,
  ) {}

  private getAllowedNewStatuses(currentStatus: UserStatus): UserStatus[] {
    const statusTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.ARCHIVED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.ARCHIVED],
      [UserStatus.ARCHIVED]: [UserStatus.ACTIVE],
    };
    return statusTransitions[currentStatus] || [];
  }

  async updateStatus(
    userId: string,
    newStatus: UserStatus,
    adminId: string,
  ): Promise<UserActionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allowedStatuses = this.getAllowedNewStatuses(user.status);
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidUserStatusException({
        currentStatus: user.status as any,
        newStatus: newStatus as any,
        allowedStatuses: allowedStatuses as any[],
        code: ErrorCode.INVALID_STATUS_TRANSITION,
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    return {
      success: true,
      message: 'User status updated successfully',
      timestamp: new Date(),
      userId,
      actionTimestamp: new Date(),
    };
  }

  private validateStatusTransition(
    currentStatus: UserStatus,
    newStatus: UserStatus,
  ): void {
    const allowedStatuses = this.getAllowedNewStatuses(currentStatus);

    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidUserStatusException({
        currentStatus: currentStatus as any,
        newStatus: newStatus as any,
        allowedStatuses: allowedStatuses as any[],
        code: ErrorCode.INVALID_STATUS_TRANSITION,
      });
    }
  }
}
