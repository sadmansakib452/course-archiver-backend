import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { UserNotFoundException } from '../../modules/users/exceptions/user.exceptions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    let errorCode = ErrorCode.UNKNOWN_ERROR;
    let message = exceptionResponse.message || exception.message;

    // Handle specific exceptions
    if (exception instanceof UserNotFoundException) {
      errorCode = ErrorCode.USER_NOT_FOUND;
    } else if (exception instanceof UnauthorizedException) {
      errorCode = ErrorCode.INVALID_CREDENTIALS;
      // Keep the specific message from the UnauthorizedException
    } else if (status === HttpStatus.NOT_FOUND) {
      errorCode = ErrorCode.USER_NOT_FOUND;
    } else if (status === HttpStatus.FORBIDDEN) {
      errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS;
    } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      errorCode = ErrorCode.VALIDATION_ERROR;
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      errorCode,
      message,
      details: exceptionResponse.details || null,
      timestamp: new Date(),
    };

    response.status(status).json(errorResponse);
  }
}
