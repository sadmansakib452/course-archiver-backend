import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ApiTags as Tags,
  ApiOperation as Operation,
  ApiResponse as Response,
  ApiBearerAuth as Bearer,
} from '@nestjs/swagger';

@Tags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@Bearer()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Operation({ summary: 'Get user profile' })
  @Response({
    status: 200,
    description: 'Returns user profile information',
  })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  @Operation({ summary: 'Update user profile' })
  @Response({
    status: 200,
    description: 'Profile updated successfully',
  })
  @Response({
    status: 400,
    description: 'Invalid input data',
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}
