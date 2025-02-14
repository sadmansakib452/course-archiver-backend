import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/constants/error-codes';
import { UserStatus } from '../../../common/constants/user-status';

export class UserAlreadyArchivedException extends BaseException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.USER_ALREADY_ARCHIVED,
      'User is already archived',
    );
  }
}

export class UserAlreadyDeletedException extends BaseException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.USER_ALREADY_DELETED,
      'User is already deleted',
    );
  }
}

export class UserNotDeletedException extends BaseException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.USER_NOT_DELETED,
      'User is not deleted',
    );
  }
}

export class InvalidUserStatusException extends BaseException {
  constructor(details: {
    currentStatus?: UserStatus;
    newStatus?: UserStatus;
    allowedStatuses?: UserStatus[];
    message?: string;
    code?: ErrorCode;
  }) {
    super(
      HttpStatus.BAD_REQUEST,
      details.code || ErrorCode.INVALID_STATUS_TRANSITION,
      details.message || 'Invalid status transition',
      {
        currentStatus: details.currentStatus,
        newStatus: details.newStatus,
        allowedStatuses: details.allowedStatuses,
      },
    );
  }
}

export class UserStatusUpdateForbiddenException extends BaseException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.USER_STATUS_UPDATE_FORBIDDEN,
      'Cannot update status of archived user',
    );
  }
}

export class UserNotFoundException extends BaseException {
  constructor(userId: string) {
    super(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'User not found', {
      userId,
    });
  }
}

export class SuperAdminModificationException extends BaseException {
  constructor(action: string) {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.SUPER_ADMIN_MODIFICATION,
      'Super admin cannot be modified',
      { action },
    );
  }
}
