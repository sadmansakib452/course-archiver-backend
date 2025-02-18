import { Semester } from '@prisma/client';

export interface BulkAssignResponse {
  success: boolean;
  message: string;
  data?: Array<{
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
  }>;
}
