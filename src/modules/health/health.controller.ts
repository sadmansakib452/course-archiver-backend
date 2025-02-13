import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        await this.healthService.checkConnections();
        return {
          services: {
            status: 'up',
            details: {
              mongodb: 'healthy',
              minio: 'healthy',
            },
          },
        };
      },
    ]);
  }
}
