import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserActivityService } from './activity.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { USER_ACTIVITIES } from '../constants/activity.constants';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UserProfileService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private activityService: UserActivityService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getProfile(userId: string): Promise<UserDto> {
    const cachedProfile = await this.cacheManager.get<UserDto>(
      `user_profile:${userId}`,
    );
    if (cachedProfile) {
      return cachedProfile;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(`user_profile:${userId}`, user);
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    // First fetch user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        password: true, // Include password for verification
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare update data
    const updateData: any = {};

    // Handle name update
    if (dto.name) {
      updateData.name = dto.name;
    }

    // Handle password update
    if (dto.newPassword) {
      // Verify current password is provided
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      // Verify current password matches
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      updateData.password = await bcrypt.hash(
        dto.newPassword,
        this.configService.get<number>('env.passwordSaltRounds', 10),
      );
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    // Clear cache
    await this.cacheManager.del(`user_profile:${userId}`);

    return {
      success: true,
      message: 'Profile updated successfully',
      timestamp: new Date(),
      data: updatedUser,
    };
  }
}
