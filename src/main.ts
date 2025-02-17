import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HealthService } from './modules/health/health.service';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const healthService = app.get(HealthService);

    // Debug: Print MinIO config with proper typing
    const minioConfig = {
      endpoint: configService.get<string>('env.minioEndpoint'),
      port: configService.get<number>('env.minioPort'),
      accessKey: configService.get<string>('env.minioAccessKey'),
      secretKey: '***' as const,
    };
    console.log('Loading with MinIO config:', minioConfig);

    // Ensure services are healthy before continuing
    await healthService.checkConnections();

    // Global pipes
    // app.useGlobalPipes(AppValidationPipe);

    // Global interceptors and filters
    // app.useGlobalInterceptors(new ApiResponseInterceptor());
    // app.useGlobalFilters(new HttpExceptionFilter());

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

    // Set global prefix with exclude
    app.setGlobalPrefix('api', {
      exclude: ['health'], // Exclude health endpoint from /api prefix
    });

    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Course Archiver API')
      .setDescription('API Documentation')
      .addTag('System', 'System-related endpoints (health, status)')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      // ... other tags
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

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

// Fix floating promise
void bootstrap();
