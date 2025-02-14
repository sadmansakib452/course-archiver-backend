import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Delete,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserStatusGuard } from './guards/user-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { ArchiveUserDto } from './dto/archive-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ArchivedUserResponseDto } from './dto/responses/user.response';
import { ArchivedUserResponse } from './interfaces/user-response.interface';

import { UserActivityService } from './services/activity.service';
import { ActivityFilterDto } from './dto/activity/activity-filter.dto';
import {
  ActivityReportDto,
  ReportType,
} from './dto/activity/activity-report.dto';
import { USER_ACTIVITIES } from './constants/activity.constants';
import { ListUsersDto } from './dto/list-users.dto';
import {
  ListUsersResponseDto,
  UserResponseDto,
  UserActionResponseDto,
} from './dto/responses/user-response.dto';
import { PermanentDeleteUserDto } from './dto/permanent-delete-user.dto';
import { UserProfileService } from './services/user-profile.service';
import { UserAdminService } from './services/user-admin.service';
import { UserStatusService } from './services/user-status.service';
import { RequestWithUser } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityService: UserActivityService,
    private readonly profileService: UserProfileService,
    private readonly adminService: UserAdminService,
    private readonly statusService: UserStatusService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile information',
    type: UserResponseDto,
  })
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDto> {
    const userId = req.user.id;
    const profile = await this.profileService.getProfile(userId);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      timestamp: new Date(),
      data: profile,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const userId = req.user.id;
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: RequestWithUser,
  ) {
    return this.statusService.updateStatus(id, dto.status, req.user.id);
  }

  @Patch(':id/archive')
  @UseGuards(UserStatusGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive user' })
  @ApiResponse({ status: 200, description: 'User archived successfully' })
  async archiveUser(
    @Param('id') id: string,
    @Body() dto: ArchiveUserDto,
    @Request() req: RequestWithUser,
  ): Promise<UserActionResponseDto> {
    return this.usersService.archiveUser(id, req.user.id, dto);
  }

  @Get('archived')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get archived users' })
  @ApiResponse({
    status: 200,
    description: 'List of archived users',
    type: [ArchivedUserResponseDto],
  })
  async getArchivedUsers(
    @Request() req: RequestWithUser,
  ): Promise<ArchivedUserResponse[]> {
    const department = req.user.department || '';
    return this.usersService.getArchivedUsers(department);
  }

  @Get(':id/activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user activities',
    description: `
      Filter activities by:
      - Date range (startDate, endDate)
      - Action type (LOGIN, LOGOUT, etc.)
      - Search text in details
      - Pagination (page, limit)
    `,
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'action', required: false, enum: USER_ACTIVITIES })
  @ApiQuery({ name: 'search', required: false })
  async getUserActivities(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query() filter: ActivityFilterDto,
  ) {
    return this.activityService.getUserActivities(id, page, limit, filter);
  }

  @Get('activities/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate activity report',
    description: 'Generate activity reports by type (daily, weekly, monthly)',
  })
  @ApiQuery({ name: 'type', enum: ReportType })
  @ApiQuery({ name: 'action', enum: USER_ACTIVITIES, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async generateActivityReport(@Query() dto: ActivityReportDto) {
    return this.activityService.generateActivityReport(dto);
  }

  @Get(':id/activities/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async exportActivities(
    @Param('id') id: string,
    @Query('format') format: 'CSV' | 'PDF',
  ) {
    return this.activityService.exportActivities(id, format);
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users with pagination',
    type: ListUsersResponseDto,
  })
  async getAllUsers(
    @Query() filters: ListUsersDto,
  ): Promise<ListUsersResponseDto> {
    return await this.usersService.getAllUsers(filters);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    type: UserActionResponseDto,
  })
  async softDeleteUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<UserActionResponseDto> {
    const userId = req.user.id;
    await this.adminService.softDeleteUser(id, userId);

    const response: UserActionResponseDto = {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date(),
      userId: id,
      actionTimestamp: new Date(),
    };
    return response;
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore deleted user' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    type: UserActionResponseDto,
  })
  async restoreUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<UserActionResponseDto> {
    const userId = req.user.id;
    await this.adminService.restoreUser(id, userId);

    const response: UserActionResponseDto = {
      success: true,
      message: 'User restored successfully',
      timestamp: new Date(),
      userId: id,
      actionTimestamp: new Date(),
    };
    return response;
  }

  @Delete(':id/permanent')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Permanently delete a user' })
  @ApiResponse({
    status: 200,
    description: 'User permanently deleted',
    type: UserActionResponseDto,
  })
  async permanentDeleteUser(
    @Param('id') id: string,
    @Body() dto: PermanentDeleteUserDto,
    @Request() req: RequestWithUser,
  ): Promise<UserActionResponseDto> {
    const userId = req.user.id;
    await this.usersService.permanentDeleteUser(id, dto, userId);

    const response: UserActionResponseDto = {
      success: true,
      message: 'User permanently deleted',
      timestamp: new Date(),
      userId: id,
      actionTimestamp: new Date(),
    };
    return response;
  }
}
