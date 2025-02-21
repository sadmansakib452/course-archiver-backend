import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

// Define the file type interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Supported file types
type SupportedMimeTypes =
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class MinioService {
  private minioClient: Client;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly useSSL: boolean;
  private readonly supportedTypes: SupportedMimeTypes[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    this.port = this.configService.get<number>('MINIO_PORT') || 9000;
    this.useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    this.minioClient = new Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey:
        this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey:
        this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin123',
    });
  }

  async uploadFile(file: MulterFile, path: string): Promise<string> {
    const bucketName =
      this.configService.get<string>('MINIO_BUCKET') || 'course-files';

    try {
      // Validate file type
      if (!this.supportedTypes.includes(file.mimetype as SupportedMimeTypes)) {
        throw new Error(
          'Unsupported file type. Only PDF and Word documents are allowed.',
        );
      }

      // Check if bucket exists, if not create it
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName);
      }

      await this.minioClient.putObject(bucketName, path, file.buffer);

      // Generate proper URL
      const protocol = this.useSSL ? 'https' : 'http';
      return `${protocol}://${this.endpoint}:${this.port}/${bucketName}/${path}`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  // Add method to generate presigned URL for file access
  async getPresignedUrl(
    bucketName: string,
    objectName: string,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(
        bucketName,
        objectName,
        24 * 60 * 60,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate presigned URL: ${errorMessage}`);
    }
  }
}
