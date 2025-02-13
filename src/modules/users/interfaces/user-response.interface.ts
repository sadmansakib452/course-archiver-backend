import { UserRole, UserStatus } from '@prisma/client';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchivedUserResponse extends UserResponse {
  archivedAt: Date | null;
  archivedReason: string | null;
  archivedBy: {
    name: string;
    role: UserRole;
  } | null;
}

export interface StatusUpdateResponse {
  message: string;
  user: UserResponse;
}

export interface ArchiveUserResponse {
  message: string;
  user: ArchivedUserResponse;
}

export interface DeletedUserResponse extends UserResponse {
  deletedAt: Date | null;
  deletedReason: string | null;
  deletedBy: {
    name: string;
    role: UserRole;
  } | null;
}

export interface SoftDeleteResponse {
  message: string;
  user: DeletedUserResponse;
}
