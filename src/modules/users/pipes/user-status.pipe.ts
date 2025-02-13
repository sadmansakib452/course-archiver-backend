import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UserStatusValidationPipe implements PipeTransform {
  private readonly allowedStatuses = [UserStatus.ACTIVE, UserStatus.INACTIVE];

  transform(value: any) {
    const status = value?.status?.toUpperCase();

    if (!status || !this.allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Status must be one of: ${this.allowedStatuses.join(', ')}`,
      );
    }

    // Prevent direct archiving through status update
    if (status === UserStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot set status to ARCHIVED. Use archive endpoint instead.',
      );
    }

    return { status };
  }
}
