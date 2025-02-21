import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { FacultyFilters } from './dto/faculty-filters.dto';
import { CourseFilters } from './dto/course-filters.dto';
import { UserCreationGuard } from '../auth/guards/user-creation.guard';
import { CreateUserDto } from '../auth/dto/create-user.dto';

@ApiTags('Admin Management')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Faculty Management
  @Post('faculty')
  @ApiOperation({ summary: 'Create new faculty member' })
  createFaculty(@Body() dto: CreateFacultyDto) {
    return this.adminService.createFaculty(dto);
  }

  @Get('faculty')
  @ApiOperation({ summary: 'List faculty members' })
  listFaculty(@Query() filters: FacultyFilters) {
    return this.adminService.listFaculty(filters);
  }

  // System Reports
  @Get('reports/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, UserCreationGuard)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid role or permissions',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }
}
