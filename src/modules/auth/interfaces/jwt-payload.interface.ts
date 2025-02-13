import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  departmentCode: string;
  iat?: number;
  exp?: number;
}
