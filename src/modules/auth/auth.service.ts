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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is deleted/archived
    if (user.status === UserStatus.ARCHIVED || user.deletedAt) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    department: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as any,
      departmentCode: user.department,
    };

    const accessTokenExpiration = '15m';
    const refreshTokenExpiration = '7d';

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiration,
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiration,
    });

    // Save refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
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
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process reset request');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
        isUsed: false,
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

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
      // Revoke all refresh tokens
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
