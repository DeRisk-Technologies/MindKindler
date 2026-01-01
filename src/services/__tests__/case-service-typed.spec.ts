// src/services/__tests__/case-service-typed.spec.ts

// Mock Firebase
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: mockCollection,
    addDoc: mockAddDoc,
    updateDoc: mockUpdateDoc,
    doc: mockDoc,
    getDoc: mockGetDoc,
    serverTimestamp: () => 'MOCK_TIMESTAMP',
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({ docs: [] })
}));

import { createCase, updateCase, CreateCaseInput } from "../case-service";

describe('Typed Case Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'case_new_123' });
        // Mock getDoc for updateCase
        mockGetDoc.mockResolvedValue({ 
            exists: () => true, 
            data: () => ({ status: 'triage', assignedTo: null }) 
        });
    });

    test('createCase writes to correct tenant path', async () => {
        const input: CreateCaseInput = {
            tenantId: 'tenant-A',
            type: 'student',
            subjectId: 'student-1',
            title: 'Test',
            description: 'Desc',
            priority: 'High',
            createdBy: 'admin-1',
            sourceAlertId: 'alert-x'
        };

        const id = await createCase(input);

        expect(id).toBe('case_new_123');
        // Check collection path
        expect(mockCollection).toHaveBeenCalledWith(undefined, "tenants", "tenant-A", "cases");
        
        // Check payload
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            status: 'triage',
            priority: 'High',
            slaDueAt: expect.any(String)
        }));
    });

    test('updateCase logs timeline event on status change', async () => {
        await updateCase('tenant-A', 'case_123', { status: 'active' }, 'user-1');

        expect(mockUpdateDoc).toHaveBeenCalled();
        // Check timeline event creation
        // The service calls addTimelineEvent which calls addDoc on subcollection
        expect(mockCollection).toHaveBeenCalledWith(undefined, "tenants", "tenant-A", "cases", "case_123", "timeline");
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            type: 'status_change',
            content: expect.stringContaining('active')
        }));
    });
});
