import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, PasswordPolicyService],
  exports: [AuditService, PasswordPolicyService],
})
export class CommonModule {}
