import { ValidationPipe } from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  errorHttpStatusCode: 422,
  exceptionFactory: (errors) => {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.reduce(
        (acc, err) => {
          acc[err.property] = Object.values(err.constraints || {});
          return acc;
        },
        {} as Record<string, string[]>,
      ),
    };
  },
});
