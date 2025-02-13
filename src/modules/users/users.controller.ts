import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  ForbiddenException,
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
import {
  UserResponseDto,
  ArchivedUserResponseDto,
  StatusUpdateResponseDto,
  ArchiveUserResponseDto,
} from './dto/responses/user.response';
import {
  UserResponse,
  ArchivedUserResponse,
  StatusUpdateResponse,
} from './interfaces/user-response.interface';
import { UserStatusValidationPipe } from './pipes/user-status.pipe';
import { ActivityListResponseDto } from './dto/activity/activity-response.dto';
import { UserActivityService } from './services/activity.service';
import { ActivityFilterDto } from './dto/activity/activity-filter.dto';
import {
  ActivityReportDto,
  ReportType,
} from './dto/activity/activity-report.dto';
import { USER_ACTIVITIES } from './constants/activity.constants';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityService: UserActivityService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile information',
  })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch(':id/status')
  @UseGuards(UserStatusGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: StatusUpdateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot update archived user',
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: { user: { id: string } },
  ): Promise<StatusUpdateResponse> {
    return this.usersService.updateUserStatus(id, req.user.id, dto);
  }

  @Patch(':id/archive')
  @UseGuards(UserStatusGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive user' })
  @ApiResponse({ status: 200, description: 'User archived successfully' })
  async archiveUser(
    @Param('id') id: string,
    @Body() dto: ArchiveUserDto,
    @Request() req,
  ) {
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
  async getArchivedUsers(@Request() req): Promise<ArchivedUserResponse[]> {
    return this.usersService.getArchivedUsers(req.user.department);
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

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete super admin or already deleted user',
  })
  async softDeleteUser(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.softDeleteUser(id, req.user.id);
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore deleted user' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not deleted/archived',
  })
  async restoreUser(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.restoreUser(id, req.user.id);
  }
}
