export const AUTH_DESCRIPTIONS = {
  ROLES: {
    FACULTY: {
      description: 'Faculty member access level',
      permissions: [
        'View and manage own courses',
        'Upload course materials',
        'View course history',
      ],
    },
    CHAIRPERSON: {
      description: 'Department chairperson access level',
      permissions: [
        'All faculty permissions',
        'Approve/reject course materials',
        'Manage faculty members',
        'View department statistics',
      ],
    },
    ADMIN: {
      description: 'System administrator access level',
      permissions: [
        'Manage users (faculty, chairperson)',
        'View system reports',
        'Configure system settings',
      ],
    },
    SUPER_ADMIN: {
      description: 'Super administrator access level',
      permissions: [
        'All admin permissions',
        'Manage admin users',
        'Access audit logs',
        'System maintenance',
      ],
    },
  },
  ERRORS: {
    UNAUTHORIZED: 'No token provided or invalid token',
    FORBIDDEN: 'User does not have required role permissions',
  },
} as const;
