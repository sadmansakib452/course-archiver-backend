import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { FacultyFilters } from './dto/faculty-filters.dto';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createFaculty(dto: CreateFacultyDto) {
    const exists = await this.prisma.facultyMember.findFirst({
      where: {
        OR: [{ email: dto.email }, { shortName: dto.shortName }],
      },
    });

    if (exists) {
      throw new BadRequestException('Faculty member already exists');
    }

    return this.prisma.facultyMember.create({
      data: {
        ...dto,
        department: process.env.DEPARTMENT_CODE || 'CSE',
      },
    });
  }

  async listFaculty(filters: FacultyFilters) {
    return this.prisma.facultyMember.findMany({
      where: {
        isActive: filters.isActive,
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search } },
            { email: { contains: filters.search } },
            { shortName: { contains: filters.search } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStats() {
    const [facultyCount, courseCount, fileCount] = await Promise.all([
      this.prisma.facultyMember.count(),
      this.prisma.course.count(),
      this.prisma.courseFiles.count(),
    ]);

    return {
      facultyCount,
      courseCount,
      fileCount,
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (exists) {
      throw new BadRequestException('User already exists');
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        role: createUserDto.role,
        department: createUserDto.departmentCode,
        isOAuthUser: false,
        googleId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    // Send welcome email with temporary password
    try {
      await this.mailService.sendAdminWelcomeEmail(
        user.email,
        user.name,
        temporaryPassword,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      ...user,
      message: 'User created successfully',
    };
  }
}
