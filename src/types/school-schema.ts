// src/types/school-schema.ts
import { ProvenanceMetadata } from "./schema";

export interface School {
    id: string;
    tenantId: string;
    name: string;
    urn?: string; // UK Specific
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
    senco: {
        name: string;
        email: string;
        phone: string;
        mobile?: string;
        linkedIn?: string;
        photoUrl?: string;
        availability?: string; // e.g. "Mon, Tue"
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
    email: string;
    photoUrl?: string;
    subjects?: string[]; // e.g. ["Maths", "Science"]
    assignedStudents?: string[]; // IDs
    scr?: {
        dbsNumber: string;
        dbsDate: string;
        checksPassed: boolean;
    };
    notes?: string; // EPP Personal Notes
}
