import { Semester } from '@prisma/client';

export interface CourseResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    code: string;
    name: string;
    section: number;
    semester: Semester;
    year: number;
    facultyId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
