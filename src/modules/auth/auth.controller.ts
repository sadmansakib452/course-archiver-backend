import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SWAGGER_GROUPS } from '../../common/constants/swagger-groups';
import { LoginResponse, RegisterResponse } from './dto/login-response.dto';
import { PreventOAuthGuard } from '../../common/guards/prevent-oauth.guard';
import { PasswordResetResponse } from './interfaces/password-reset-response.interface';
import { RequestWithUser } from './interfaces/authenticated-request.interface';

@ApiTags(SWAGGER_GROUPS.AUTH.name)
@ApiExtraModels(LoginResponse, RegisterResponse)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new faculty user',
    description: `Faculty registration process:
    1. Validates faculty email against department records
    2. Creates new user account with FACULTY role
    3. Sends welcome email with verification link`,
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: RegisterResponse,
    schema: {
      example: {
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'faculty@university.edu',
          name: 'John Doe',
          role: 'FACULTY',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Faculty member not found or user already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: `Role-based authentication system:
    
    1. Faculty Access (${SWAGGER_GROUPS.FACULTY.auth}):
    - ${Object.values(SWAGGER_GROUPS.FACULTY.endpoints).join('\n    - ')}
    
    2. Chairperson Access (${SWAGGER_GROUPS.CHAIRPERSON.auth}):
    - ${Object.values(SWAGGER_GROUPS.CHAIRPERSON.endpoints).join('\n    - ')}
    
    3. Admin Access (${SWAGGER_GROUPS.ADMIN.auth}):
    - ${Object.values(SWAGGER_GROUPS.ADMIN.endpoints).join('\n    - ')}
    
    4. Super Admin Access (${SWAGGER_GROUPS.SUPER_ADMIN.auth}):
    - ${Object.values(SWAGGER_GROUPS.SUPER_ADMIN.endpoints).join('\n    - ')}`,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponse,
    schema: {
      example: {
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'FACULTY',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  async logout(@Request() req: RequestWithUser) {
    return this.authService.logout(req.user.id);
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset instructions sent',
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/reset')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 422,
    description: 'Password validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @UseGuards(PreventOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login (Faculty only)' })
  googleAuth() {
    // ... existing code
  }
}
