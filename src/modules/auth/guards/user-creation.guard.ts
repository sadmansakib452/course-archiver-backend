import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    role: UserRole;
  };
  body: {
    role?: UserRole;
  };
}

@Injectable()
export class UserCreationGuard implements CanActivate {
  private isValidUserRole(role: unknown): role is UserRole {
    return (
      typeof role === 'string' &&
      Object.values(UserRole).includes(role as UserRole)
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Type-safe user role check
    const userRole = request.user?.role;
    if (!userRole || !this.isValidUserRole(userRole)) {
      throw new ForbiddenException('Invalid user role');
    }

    // Type-safe target role check
    const targetRole = request.body?.role;
    if (!targetRole || !this.isValidUserRole(targetRole)) {
      throw new ForbiddenException('Invalid target role specified');
    }

    // Role-based permission matrix
    const rolePermissions = new Map<UserRole, UserRole[]>([
      [UserRole.SUPER_ADMIN, Object.values(UserRole)],
      [UserRole.ADMIN, [UserRole.CHAIRPERSON, UserRole.FACULTY]],
      [UserRole.CHAIRPERSON, []],
      [UserRole.FACULTY, []],
    ]);

    const allowedRoles = rolePermissions.get(userRole) || [];
    return allowedRoles.includes(targetRole);
  }
}
