// src/integrations/connectors/lms-connector-stub.ts

import { StudentRecord, ProvenanceField } from '@/types/schema';

// Standardized Import Interface (Canonical)
export interface ImportedStudent {
    externalId: string; // SIS ID
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    schoolName: string;
    gradeLevel: string;
    enrollmentStatus: 'Active' | 'Inactive';
    address?: string;
    contacts: {
        name: string;
        relationship: string;
        phone: string;
        email: string;
        primary: boolean;
    }[];
}

export class LmsConnectorStub {
    
    /**
     * Simulates fetching a roster from a school SIS/LMS (e.g. PowerSchool, SIMS, Arbor via OneRoster/Wonde)
     */
    static async fetchStudentRoster(schoolId: string): Promise<ImportedStudent[]> {
        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock Data
        return [
            {
                externalId: "STU-001",
                firstName: "Alice",
                lastName: "Wonderland",
                dob: "2014-03-15",
                gender: "Female",
                schoolName: "West High",
                gradeLevel: "5",
                enrollmentStatus: "Active",
                address: "123 Rabbit Hole Ln",
                contacts: [
                    { name: "Martha Wonderland", relationship: "Mother", phone: "555-0101", email: "martha@example.com", primary: true }
                ]
            },
            {
                externalId: "STU-002",
                firstName: "Bob",
                lastName: "Builder",
                dob: "2014-06-20",
                gender: "Male",
                schoolName: "West High",
                gradeLevel: "5",
                enrollmentStatus: "Active",
                address: "456 Construction Rd",
                contacts: [
                    { name: "Wendy Builder", relationship: "Mother", phone: "555-0102", email: "wendy@example.com", primary: true }
                ]
            }
        ];
    }

    /**
     * Convert imported data to our internal StudentRecord format (for Staging/Preview)
     */
    static transformToStudent(importData: ImportedStudent, tenantId: string): Partial<StudentRecord> {
        return {
            identity: {
                firstName: { value: importData.firstName, metadata: { source: 'lms', verified: false, confidence: 1 } },
                lastName: { value: importData.lastName, metadata: { source: 'lms', verified: false, confidence: 1 } },
                dateOfBirth: { value: importData.dob, metadata: { source: 'lms', verified: false, confidence: 1 } },
                gender: { value: importData.gender, metadata: { source: 'lms', verified: false, confidence: 1 } },
                nationalId: { value: importData.externalId, metadata: { source: 'lms', verified: false, confidence: 1 } }, // Using ext ID as placeholder
            },
            education: {
                yearGroup: { value: importData.gradeLevel, metadata: { source: 'lms', verified: false, confidence: 1 } },
                // currentSchoolId needs lookup logic
            }
        };
    }
}
