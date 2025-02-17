import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { randomBytes } from 'crypto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { UserStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { PasswordResetResponse } from './interfaces/password-reset-response.interface';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async validateFacultyMember(email: string) {
    const facultyMember = await this.prisma.facultyMember.findUnique({
      where: { email },
    });

    if (!facultyMember) {
      throw new BadRequestException(
        'Faculty member not found. Please contact department admin.',
      );
    }

    return facultyMember;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if faculty member exists
    const facultyMember = await this.validateFacultyMember(email);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(
      this.configService.get<number>('env.passwordSaltRounds'),
    );
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'FACULTY',
        department: facultyMember.department,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // First revoke all existing refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    // Then create the new refresh token
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        isRevoked: false,
      },
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        status: true,
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Please contact department office');
    }

    if (user.status === UserStatus.ARCHIVED) {
      throw new UnauthorizedException('This account has been deleted');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verify refresh token exists and is not revoked
      const savedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
        include: { user: true },
      });

      if (
        !savedToken ||
        savedToken.isRevoked ||
        savedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke the old refresh token
      await this.prisma.refreshToken.update({
        where: { id: savedToken.id },
        data: { isRevoked: true },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(savedToken.user);

      return {
        user: {
          id: savedToken.user.id,
          email: savedToken.user.email,
          name: savedToken.user.name,
          role: savedToken.user.role,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token', error);
    }
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for the user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return {
      success: true,
      message: 'Successfully logged out',
    };
  }

  private async generateTokens(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentCode: user.department,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      // Generate unique refresh token using uuid
      this.generateUniqueRefreshToken(),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  private async generateUniqueRefreshToken(): Promise<string> {
    // Generate a unique token using uuid
    const token = `${uuid()}.${Date.now()}`;

    // Check if token already exists
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    // If token exists (very unlikely), generate a new one
    if (existingToken) {
      return this.generateUniqueRefreshToken();
    }

    return token;
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        return {
          message:
            'If your email is registered, you will receive reset instructions.',
        };
      }

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Save reset token
      await this.prisma.passwordReset.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      try {
        await this.mailService.sendPasswordResetEmail(user.email, token);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        throw new InternalServerErrorException('Failed to send reset email');
      }

      return {
        message: 'Password reset instructions sent.',
      };
    } catch (error) {
      console.error('Password reset request failed:', error);

      return {
        message: 'Failed to process reset request',
      };
    }
  }

  private validatePassword(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters',
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    return { isValid: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<PasswordResetResponse> {
    // Validate password
    const passwordValidation = this.validatePassword(dto.newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        statusCode: 422,
        message: 'Password validation failed',
        timestamp: new Date(),
        details: {
          password: passwordValidation.message,
        },
      };
    }

    // Check reset token
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
        isUsed: false,
      },
      include: { user: true },
    });

    if (!resetRecord) {
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid or expired reset token',
        timestamp: new Date(),
      };
    }

    try {
      // Hash new password
      const salt = await bcrypt.genSalt(
        this.configService.get<number>('env.passwordSaltRounds'),
      );
      const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetRecord.userId },
          data: { password: hashedPassword },
        }),
        this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { isUsed: true },
        }),
        this.prisma.refreshToken.updateMany({
          where: { userId: resetRecord.userId },
          data: { isRevoked: true },
        }),
      ]);

      return {
        success: true,
        statusCode: 200,
        message: 'Password has been reset successfully',
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to reset password',
        timestamp: new Date(),
        details: { error: errorMessage },
      };
    }
  }
}
