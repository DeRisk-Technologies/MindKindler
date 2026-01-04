import { redactStudentRecord } from '../redaction';
import { StudentRecord, Role } from '@/types/schema';

describe('Guardian Redaction Engine', () => {
    
    const mockStudent: StudentRecord = {
        id: 'stu-1',
        tenantId: 'tenant-1',
        identity: {
            firstName: { value: 'John', metadata: { source: 'manual', verified: true } },
            lastName: { value: 'Doe', metadata: { source: 'manual', verified: true } },
            dateOfBirth: { value: '2010-01-01', metadata: { source: 'manual', verified: true } },
            gender: { value: 'Male', metadata: { source: 'manual', verified: true } },
            nationalId: { value: 'NHS-123', metadata: { source: 'manual', verified: true } }
        },
        education: {},
        family: { parents: [] },
        health: {
            allergies: { value: ['Peanuts'], metadata: { source: 'manual', verified: true } },
            conditions: { value: [], metadata: { source: 'manual', verified: true } },
            medications: { value: [], metadata: { source: 'manual', verified: true } }
        },
        careHistory: {
            isLookedAfter: true,
            placements: []
        },
        discipline: [],
        meta: {
            createdAt: '', createdBy: '', updatedAt: '', updatedBy: '',
            trustScore: 100, completenessScore: 100, privacyLevel: 'standard'
        }
    };

    test('EPP (Clinician) sees everything', () => {
        const result = redactStudentRecord(mockStudent, 'EPP');
        expect(result.careHistory).toBeDefined();
        expect(result.identity?.nationalId?.value).toBe('NHS-123');
    });

    test('SchoolAdmin cannot see sensitive care history', () => {
        const result = redactStudentRecord(mockStudent, 'SchoolAdmin');
        expect(result.careHistory).toBeUndefined(); // Should be redacted
        expect(result.identity?.nationalId?.value).toBe('NHS-123'); // Allowed
    });

    test('ParentUser cannot see sensitive care history or other restricted fields', () => {
        // Assuming parents shouldn't see raw social work notes (careHistory)
        const result = redactStudentRecord(mockStudent, 'ParentUser');
        expect(result.careHistory).toBeUndefined();
    });

    test('Anonymized Level strips identity', () => {
        const result = redactStudentRecord(mockStudent, 'EPP', [], 'ANONYMIZED');
        expect(result.identity?.firstName?.value).toBe('Student');
        expect(result.identity?.nationalId).toBeUndefined();
    });

    test('Restricted Record blocks access for normal users', () => {
        const restrictedStudent = { ...mockStudent, meta: { ...mockStudent.meta, privacyLevel: 'restricted' as const } };
        const result = redactStudentRecord(restrictedStudent, 'SchoolAdmin');
        
        // Should be almost empty
        expect(result.identity).toBeUndefined();
        expect(result.meta?.privacyLevel).toBe('restricted');
    });
});
