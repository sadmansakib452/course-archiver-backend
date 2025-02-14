import { HttpException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

export class BaseException extends HttpException {
  constructor(
    statusCode: number,
    errorCode: ErrorCode,
    message: string,
    details?: Record<string, any>,
  ) {
    super(
      {
        success: false,
        errorCode,
        message,
        details,
        timestamp: new Date(),
      },
      statusCode,
    );
  }
}
