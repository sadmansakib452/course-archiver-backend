import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage/storage.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    // Check connections during startup
    await this.checkConnections();
  }

  async checkConnections(): Promise<void> {
    try {
      // Check MongoDB connection
      await this.checkMongoDB();

      // Check MinIO connection
      await this.checkMinIO();

      console.log('All services are healthy! Application is ready.');
    } catch (error) {
      console.error('Service health check failed:', error.message);
      throw new ServiceUnavailableException(
        'Required services are not available',
        error.message,
      );
    }
  }

  private async checkMongoDB(): Promise<void> {
    try {
      // Use a simple command to check MongoDB connection
      await this.prisma.$runCommandRaw({ ping: 1 });
      console.log('MongoDB connection is healthy');
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }

  private async checkMinIO(): Promise<void> {
    try {
      const bucketName = this.config.get<string>('env.minioBucket');
      if (!bucketName) {
        throw new Error('MinIO bucket name is not configured');
      }
      await this.storage.checkConnection(bucketName);
      console.log('MinIO connection is healthy');
    } catch (error) {
      throw new Error(`MinIO connection failed: ${error.message}`);
    }
  }
}
