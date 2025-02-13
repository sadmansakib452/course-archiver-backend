export interface AdminResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  departmentName?: string;
  departmentCode?: string;
  maxFileSize?: number;
  allowedFileTypes?: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface AuditLogResponse {
  id: string;
  userId: string;
  action: string;
  details: any;
  createdAt: Date;
  user: {
    email: string;
    name: string;
  };
}
