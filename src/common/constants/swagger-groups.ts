export const SWAGGER_GROUPS = {
  AUTH: {
    name: 'Authentication',
    description: 'Authentication endpoints for all users',
  },
  FACULTY: {
    name: 'Faculty Access',
    description: 'Endpoints accessible by faculty members',
    auth: 'Requires FACULTY role',
    endpoints: {
      COURSES: 'Manage course materials and view history',
      PROFILE: 'View and update faculty profile',
    },
  },
  CHAIRPERSON: {
    name: 'Chairperson Access',
    description: 'Department management endpoints',
    auth: 'Requires CHAIRPERSON role',
    endpoints: {
      FACULTY: 'Manage faculty members',
      APPROVALS: 'Review and approve course materials',
      REPORTS: 'View department statistics',
    },
  },
  ADMIN: {
    name: 'Admin Access',
    description: 'System administration endpoints',
    auth: 'Requires ADMIN role',
    endpoints: {
      USERS: 'Manage users and roles',
      SETTINGS: 'Configure system settings',
      REPORTS: 'View system reports',
    },
  },
  SUPER_ADMIN: {
    name: 'Super Admin Access',
    description: 'System-wide administration endpoints',
    auth: 'Requires SUPER_ADMIN role',
    endpoints: {
      ADMINS: 'Manage admin users',
      AUDIT: 'View system audit logs',
      MAINTENANCE: 'System maintenance tasks',
    },
  },
} as const;
