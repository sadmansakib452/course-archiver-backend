import { UserRole } from '@prisma/client';

export function isValidUserRole(role: any): role is UserRole {
  return Object.values(UserRole).includes(role);
}
