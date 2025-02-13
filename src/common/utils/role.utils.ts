import { UserRole } from '@prisma/client';

export function isValidUserRole(role: unknown): role is UserRole {
  return (
    typeof role === 'string' &&
    Object.values(UserRole).includes(role as UserRole)
  );
}
