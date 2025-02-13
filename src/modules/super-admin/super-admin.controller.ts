import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiExtraModels,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuperAdminService } from './super-admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuditLogFilters } from './dto/audit-log-filters.dto';
import { AdminResponse } from './responses/admin.response';
import { SystemSettingsResponse } from './responses/system-settings.response';
import { AuditLogResponse } from './responses/audit-log.response';
import { ROLE_DESCRIPTIONS } from '../../common/constants/role-descriptions';

@ApiTags('Super Admin Management')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiSecurity('bearer')
@ApiExtraModels(AdminResponse, SystemSettingsResponse, AuditLogResponse)
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token for Super Admin authentication',
  required: true,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - No token provided or invalid token',
})
@ApiResponse({
  status: 403,
  description: `Forbidden - Requires Super Admin Role (${ROLE_DESCRIPTIONS.SUPER_ADMIN})`,
  schema: {
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  },
})
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('admins')
  @ApiOperation({
    summary: 'Create new admin user',
    description: `Creates a new admin user. Welcome email will be sent if email service is configured.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        name: 'System Admin',
        role: 'ADMIN',
        createdAt: '2024-01-20T12:00:00Z',
        updatedAt: '2024-01-20T12:00:00Z',
        message:
          'Admin created successfully. Note: Welcome email could not be sent.',
        temporaryPassword: 'Admin123', // Only included if email fails
      },
    },
  })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.superAdminService.createAdmin(dto);
  }

  @Get('admins')
  @ApiOperation({
    summary: 'List all admin users',
    description: 'Retrieves a list of all admin users in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of admin users',
    type: [AdminResponse],
  })
  listAdmins(): Promise<AdminResponse[]> {
    return this.superAdminService.listAdmins();
  }

  @Put('settings')
  @ApiOperation({
    summary: 'Update system settings',
    description: 'Updates global system configuration settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: SystemSettingsResponse,
  })
  updateSettings(
    @Body() dto: UpdateSettingsDto,
  ): Promise<SystemSettingsResponse> {
    return this.superAdminService.updateSettings(dto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get system statistics',
    description:
      'Retrieves system-wide statistics including user counts and storage usage',
  })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
    schema: {
      example: {
        totalUsers: 100,
        activeUsers: 85,
        adminCount: 5,
        courseCount: 50,
        storageUsed: '1.2GB',
      },
    },
  })
  getSystemStats() {
    return this.superAdminService.getSystemStats();
  }

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Get system audit logs',
    description: `Retrieves system audit logs with optional filtering. 
                 Available only to Super Admin (${ROLE_DESCRIPTIONS.SUPER_ADMIN})`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
    type: [AuditLogResponse],
  })
  getAuditLogs(@Query() filters: AuditLogFilters): Promise<AuditLogResponse[]> {
    return this.superAdminService.getAuditLogs(filters);
  }
}
