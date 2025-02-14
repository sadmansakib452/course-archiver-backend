import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'System Health Check',
    description:
      'Check the health status of all system components (Database, Redis, MinIO)',
  })
  @ApiResponse({
    status: 200,
    description: 'All systems operational',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up',
            message: 'Database connection is healthy',
          },
          redis: {
            status: 'up',
            message: 'Redis connection is healthy',
          },
          services: {
            status: 'up',
            details: {
              minio: 'healthy',
            },
          },
        },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkRedis(),
      () => this.checkServices(),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      return {
        database: {
          status: 'up',
          message: 'Database connection is healthy',
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      const testKey = 'health-check-test';
      await this.cacheManager.set(testKey, 'test', 30);
      const testValue = await this.cacheManager.get(testKey);

      if (testValue !== 'test') {
        throw new Error('Redis read/write test failed');
      }

      return {
        redis: {
          status: 'up',
          message: 'Redis connection is healthy',
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: 'Redis connection failed',
          error: error.message,
        },
      };
    }
  }

  private async checkServices(): Promise<HealthIndicatorResult> {
    try {
      const servicesStatus = await this.healthService.checkConnections();
      return {
        services: {
          status: 'up',
          ...servicesStatus,
        },
      };
    } catch (error) {
      return {
        services: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }
}
