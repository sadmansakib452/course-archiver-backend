import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StorageModule } from '../../common/services/storage/storage.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [TerminusModule, StorageModule, PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
