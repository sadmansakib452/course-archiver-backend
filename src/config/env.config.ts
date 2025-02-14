import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),

  // Database
  databaseUrl:
    process.env.DATABASE_URL ?? 'mongodb://localhost:27017/course-archiver',

  // MinIO
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  minioPort: parseInt(process.env.MINIO_PORT ?? '9000', 10),
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET ?? 'course-files',

  // Department
  departmentName:
    process.env.DEPARTMENT_NAME ?? 'Computer Science & Engineering',
  departmentCode: process.env.DEPARTMENT_CODE ?? 'CSE',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET ?? 'super-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',

  // Password Config
  passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS ?? '10', 10),

  // Frontend URL for reset links
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    ttl: Number(process.env.CACHE_TTL || 3600),
  },
}));
