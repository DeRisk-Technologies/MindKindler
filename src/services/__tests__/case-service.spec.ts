// src/services/__tests__/case-service.spec.ts

// Mock Firebase
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: mockCollection,
    addDoc: mockAddDoc,
    doc: jest.fn(),
    updateDoc: jest.fn(),
    serverTimestamp: () => 'MOCK_TIMESTAMP'
}));

import { createCase, CreateCaseInput } from "../case-service"; // Updated import

describe('Case Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'case_123' });
    });

    test('createCase creates case doc', async () => {
        const input: CreateCaseInput = {
            tenantId: 't1',
            type: 'student',
            subjectId: 's1',
            title: 'Test Case',
            description: 'Desc',
            priority: 'High',
            sourceAlertId: 'a1',
            createdBy: 'u1'
        };

        const result = await createCase(input);

        expect(result).toBe('case_123');
        expect(mockCollection).toHaveBeenCalledWith(undefined, "tenants", "t1", "cases");
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            title: 'Test Case',
            priority: 'High',
            sourceAlertId: 'a1',
            status: 'triage'
        }));
    });
});
