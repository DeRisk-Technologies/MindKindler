// src/integrations/schemas/canonical.ts

export interface StudentImport {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO or parseable
    schoolId: string;
    classId?: string;
    gender?: 'male' | 'female' | 'other';
    email?: string;
}

export interface TeacherImport {
    firstName: string;
    lastName: string;
    email: string;
    schoolId: string;
    role?: 'teacher' | 'head_teacher' | 'epp';
}

export interface ClassImport {
    id: string;
    name: string;
    schoolId: string;
    teacherId?: string;
}
