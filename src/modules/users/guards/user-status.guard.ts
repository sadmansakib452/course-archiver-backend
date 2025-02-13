import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class UserStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.id;
    const targetStatus = request.body.status;

    // Super Admin can manage all users
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can only manage FACULTY and CHAIRPERSON
    if (user.role === UserRole.ADMIN) {
      return [UserRole.FACULTY, UserRole.CHAIRPERSON].includes(
        request.targetUser?.role,
      );
    }

    return false;
  }
}
