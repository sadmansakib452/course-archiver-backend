import { Semester } from '@prisma/client';

export interface CourseListResponse {
  success: boolean;
  message: string;
  data?: {
    courses: {
      id: string;
      code: string;
      name: string;
      section: number;
      semester: Semester;
      year: number;
      faculty: {
        id: string;
        name: string;
        email: string;
        shortName: string;
      };
      createdAt: Date;
      updatedAt: Date;
    }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
} 