import { Semester } from '@prisma/client';

export interface CourseListResponse {
  success: boolean;
  message: string;
  data?: {
    courses: Array<{
      id: string;
      code: string;
      name: string;
      section: number;
      semester: Semester;
      year: number;
      facultyId: string | null;
      faculty: {
        id: string;
        name: string;
        email: string;
        shortName: string;
      } | null;
      createdAt: Date;
      updatedAt: Date;
      isActive: boolean;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}
