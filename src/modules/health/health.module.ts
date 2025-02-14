import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StorageModule } from '../../common/services/storage/storage.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TerminusModule,
    StorageModule,
    PrismaModule,
    CacheModule.register(),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
