// src/types/school-schema.ts
import { ProvenanceMetadata } from "./schema";

export interface School {
    id: string;
    tenantId: string;
    name: string;
    urn?: string; // UK Specific
    type: 'primary' | 'secondary' | 'special' | 'independent' | 'college' | 'other';
    address: {
        street: string;
        city: string;
        postcode: string;
        coordinates?: { lat: number; lng: number }; // GIS
    };
    contact: {
        phone: string;
        email: string;
        website?: string;
    };
    // Enhanced SENCO Profile
    senco: {
        name: string;
        email: string;
        phone: string;
        mobile?: string;
        role?: string; // e.g. "Assistant Head / SENCO"
        qualifications?: string[]; // e.g. "NASENCO Award"
        officeHours?: string;
        notes?: string;
    };
    // 360 School Info
    calendar: {
        termDates: { name: string; start: string; end: string }[];
        holidays: { name: string; date: string }[];
        events: { name: string; date: string; type: string }[];
    };
    operations: {
        schoolDayStart: string;
        schoolDayEnd: string;
        timetables: {
            class: string;
            url?: string; // Link to PDF/Image
        }[];
    };
    curriculum: {
        subjects: string[];
        examBoards?: Record<string, string>; // e.g. "Maths": "AQA"
    };
    stats: {
        studentsOnRoll: number;
        senRegister: number;
        staffCount: number;
        activeCases: number;
    };
    notes?: {
        id: string;
        content: string;
        authorId: string;
        createdAt: string;
    }[];
    metadata: ProvenanceMetadata;
}

export interface StaffMember {
    id: string;
    tenantId: string;
    schoolId?: string; // Association
    firstName: string;
    lastName: string;
    role: string; // e.g. "Class Teacher", "TA", "Head"
    category: 'academic' | 'support' | 'admin' | 'leadership';
    email: string;
    phone?: string;
    photoUrl?: string;
    subjects?: string[]; // e.g. ["Maths", "Science"]
    assignedClasses?: string[]; // e.g. ["Year 5 Blue", "10X1"]
    assignedStudents?: string[]; // IDs
    scr?: {
        dbsNumber: string;
        dbsDate: string;
        checksPassed: boolean;
    };
    notes?: string; // EPP Personal Notes
}

export interface StudentAcademicRecord {
    id: string;
    studentId: string;
    schoolId: string;
    currentClass: string; // e.g. "6A"
    formTutorId?: string; // Link to StaffMember
    subjects: {
        name: string;
        teacherId?: string; // Link to StaffMember
        predictedGrade?: string;
        currentGrade?: string;
    }[];
    timetable?: {
        day: string;
        period: number;
        subject: string;
        room: string;
    }[];
    examAccessArrangements?: string[]; // e.g. "25% Extra Time"
}
