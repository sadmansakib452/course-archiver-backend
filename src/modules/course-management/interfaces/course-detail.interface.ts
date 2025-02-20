import { Semester } from '@prisma/client';

export interface CourseDetailResponse {
  success: boolean;
  message: string;
  data?: {
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
    } | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
}
