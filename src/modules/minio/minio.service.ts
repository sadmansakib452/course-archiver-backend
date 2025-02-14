import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService {
  public client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      endPoint: this.configService.get('env.minioEndpoint', 'localhost'),
      port: this.configService.get('env.minioPort', 9000),
      useSSL: false,
      accessKey: this.configService.get('env.minioAccessKey', 'minioadmin'),
      secretKey: this.configService.get('env.minioSecretKey', 'minioadmin'),
    });
  }
}
