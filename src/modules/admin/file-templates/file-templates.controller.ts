import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { FileTemplatesService } from './file-templates.service';
import { Request } from 'express';
import {
  TemplateResponseDto,
  TemplateListResponseDto,
} from './dto/template-response.dto';
import { TemplateStatsDto } from './dto/template-stats.dto';
import { SearchTemplateDto } from './dto/search-template.dto';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('Admin - File Templates')
@Controller('admin/file-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class FileTemplatesController {
  constructor(private readonly fileTemplatesService: FileTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new file template' })
  @ApiResponse({ type: TemplateResponseDto })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Req() req: Request & { user: User },
  ): Promise<TemplateResponseDto> {
    return this.fileTemplatesService.createTemplate(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all file templates' })
  @ApiResponse({ type: TemplateListResponseDto })
  async listTemplates(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ): Promise<TemplateListResponseDto> {
    return this.fileTemplatesService.listTemplates({
      status: status ? status === 'true' : undefined,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search templates' })
  async searchTemplates(@Query() searchDto: SearchTemplateDto) {
    return this.fileTemplatesService.searchTemplates(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific template' })
  async getTemplate(@Param('id') id: string) {
    return this.fileTemplatesService.getTemplate(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.fileTemplatesService.updateTemplate(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  async deleteTemplate(@Param('id') id: string) {
    return this.fileTemplatesService.deleteTemplate(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle template status' })
  async toggleStatus(@Param('id') id: string) {
    return this.fileTemplatesService.toggleStatus(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get template usage statistics' })
  @ApiResponse({ type: TemplateStatsDto })
  async getTemplateStats(@Param('id') id: string) {
    return this.fileTemplatesService.getTemplateStats(id);
  }
}
