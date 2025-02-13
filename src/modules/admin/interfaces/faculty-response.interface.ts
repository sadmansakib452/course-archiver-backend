export interface FacultyResponse {
  id: string;
  shortName: string;
  name: string;
  email: string;
  designation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemStats {
  facultyCount: number;
  courseCount: number;
  fileCount: number;
  activeUsers?: number;
  pendingApprovals?: number;
}
