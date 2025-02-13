import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, details: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  }
}
