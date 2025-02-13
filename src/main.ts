import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAPIObject, SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { HealthService } from './modules/health/health.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Debug: Print MinIO config
    console.log('Loading with MinIO config:', {
      endpoint: configService.get('env.minioEndpoint'),
      port: configService.get('env.minioPort'),
      accessKey: configService.get('env.minioAccessKey'),
      secretKey: '***',
    });

    const healthService = app.get(HealthService);

    // Ensure services are healthy before continuing
    await healthService.checkConnections();

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Security
    app.use(helmet());
    app.enableCors({
      origin: configService.get<string>('env.frontendUrl'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
      ],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 3600,
    });

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Course Archiver API')
      .setDescription('Course Archiver API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    // Global prefix
    app.setGlobalPrefix('api');

    const port = configService.get<number>('env.port', 3000);
    await app.listen(port);

    console.log(`Application running on port ${port}`);
    console.log(
      `Swagger documentation available at http://localhost:${port}/docs`,
    );
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
