import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
  department?: string;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
