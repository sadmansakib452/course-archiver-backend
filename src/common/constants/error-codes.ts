export enum ErrorCode {
  // User related errors
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  INVALID_STATUS_TRANSITION = 'USER_003',
  INVALID_ROLE_ASSIGNMENT = 'USER_004',
  SUPER_ADMIN_MODIFICATION = 'USER_005',
  USER_ALREADY_ARCHIVED = 'USER_006',
  USER_ALREADY_DELETED = 'USER_007',
  USER_NOT_DELETED = 'USER_008',
  USER_STATUS_UPDATE_FORBIDDEN = 'USER_009',
  VALIDATION_ERROR = 'VALIDATION_001',

  // Authentication errors
  INVALID_CREDENTIALS = 'AUTH_001',
  ACCOUNT_DELETED = 'AUTH_002',
  ACCOUNT_INACTIVE = 'AUTH_003',
  USER_NOT_FOUND_AUTH = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',
  INSUFFICIENT_PERMISSIONS = 'AUTH_006',

  // General errors
  DATABASE_ERROR = 'GEN_002',
  UNKNOWN_ERROR = 'GEN_999',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'Invalid status transition',
  [ErrorCode.INVALID_ROLE_ASSIGNMENT]: 'Invalid role assignment',
  [ErrorCode.SUPER_ADMIN_MODIFICATION]: 'Super admin cannot be modified',
  [ErrorCode.USER_ALREADY_ARCHIVED]: 'User already archived',
  [ErrorCode.USER_ALREADY_DELETED]: 'User already deleted',
  [ErrorCode.USER_NOT_DELETED]: 'User not deleted',
  [ErrorCode.USER_STATUS_UPDATE_FORBIDDEN]: 'User status update forbidden',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.ACCOUNT_DELETED]: 'This account has been deleted',
  [ErrorCode.ACCOUNT_INACTIVE]: 'This account is inactive',
  [ErrorCode.USER_NOT_FOUND_AUTH]: 'No account found with this email',
  [ErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ErrorCode.DATABASE_ERROR]: 'Database error',
  [ErrorCode.UNKNOWN_ERROR]: 'Unknown error',
};
