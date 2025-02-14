import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { AuditService } from './services/audit.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CacheService, AuditService, PasswordPolicyService],
  exports: [CacheService, AuditService, PasswordPolicyService],
})
export class CommonModule {}
