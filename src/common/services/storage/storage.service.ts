import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Client | undefined;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeMinioClient();
  }

  private async initializeMinioClient() {
    try {
      const endPoint = this.configService.get<string>('env.minioEndpoint');
      const port = this.configService.get<number>('env.minioPort');
      const accessKey = this.configService.get<string>('env.minioAccessKey');
      const secretKey = this.configService.get<string>('env.minioSecretKey');

      // Debug log
      console.log('MinIO Config:', {
        endPoint,
        port,
        accessKey,
        secretKey: '***', // Hide secret key in logs
      });

      // Validate required configurations
      if (!endPoint || !port || !accessKey || !secretKey) {
        throw new Error('MinIO configuration is incomplete');
      }

      this.minioClient = new Client({
        endPoint,
        port,
        useSSL: false,
        accessKey,
        secretKey,
      });

      // Test connection immediately after initialization
      try {
        await this.minioClient.listBuckets();
        console.log('MinIO client initialized and connected successfully');
      } catch (connError) {
        console.error('MinIO connection test failed:', connError.message);
        this.minioClient = undefined;
        throw connError;
      }
    } catch (error) {
      console.error('Failed to initialize MinIO client:', error.message);
      this.minioClient = undefined;
      throw error;
    }
  }

  async checkConnection(bucketName: string): Promise<void> {
    try {
      if (!this.minioClient) {
        await this.initializeMinioClient(); // Try to reinitialize if not available
      }

      if (!this.minioClient) {
        throw new Error('Failed to initialize MinIO client');
      }

      // Check if we can list buckets (tests authentication)
      await this.minioClient.listBuckets();
      console.log('MinIO bucket list successful');

      // Check if our bucket exists
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      console.log('Bucket exists check:', bucketExists);

      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        await this.minioClient.makeBucket(bucketName);
        console.log(`Bucket ${bucketName} created successfully`);
      }

      console.log('MinIO connection and bucket check successful');
    } catch (error) {
      console.error('MinIO connection check failed:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
      throw new Error(`MinIO connection failed: ${error.message}`);
    }
  }

  getClient(): Client {
    if (!this.minioClient) {
      throw new Error('MinIO client is not initialized');
    }
    return this.minioClient;
  }
}
