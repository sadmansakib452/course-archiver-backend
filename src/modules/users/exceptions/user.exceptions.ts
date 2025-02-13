import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyArchivedException extends HttpException {
  constructor() {
    super('User is already archived', HttpStatus.FORBIDDEN);
  }
}

export class UserAlreadyDeletedException extends HttpException {
  constructor() {
    super('User is already deleted', HttpStatus.FORBIDDEN);
  }
}

export class UserNotDeletedException extends HttpException {
  constructor() {
    super('User is not deleted', HttpStatus.FORBIDDEN);
  }
}

export class InvalidUserStatusException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UserStatusUpdateForbiddenException extends HttpException {
  constructor() {
    super('Cannot update status of archived user', HttpStatus.FORBIDDEN);
  }
}
