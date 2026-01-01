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

import { createCaseFromAlert } from "../case-service";

describe('Case Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'case_123' });
    });

    test('createCaseFromAlert creates case doc', async () => {
        const input = {
            tenantId: 't1',
            studentId: 's1',
            title: 'Test Case',
            description: 'Desc',
            priority: 'High' as const,
            sourceAlertId: 'a1',
            createdBy: 'u1'
        };

        const result = await createCaseFromAlert(input);

        expect(result).toBe('case_123');
        expect(mockCollection).toHaveBeenCalledWith(undefined, "cases");
        expect(mockAddDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
            title: 'Test Case',
            priority: 'High',
            sourceAlertId: 'a1',
            status: 'Open'
        }));
    });
});
