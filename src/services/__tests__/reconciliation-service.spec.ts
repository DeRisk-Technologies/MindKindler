// src/services/__tests__/reconciliation-service.spec.ts

import { ReconciliationService } from "../reconciliation-service";

// Mocks
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();

jest.mock("@/lib/firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
    doc: jest.fn().mockImplementation((db, path) => ({ id: 'mock-ref', path })),
    collection: jest.fn().mockImplementation((db, path) => ({ id: 'mock-col-ref', path })),
    getDoc: () => mockGetDoc(),
    updateDoc: (ref: any, data: any) => mockUpdateDoc(ref, data),
    addDoc: (ref: any, data: any) => mockAddDoc(ref, data),
    serverTimestamp: () => 'MOCK_TIME'
}));

describe("ReconciliationService", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("approveExtraction publishes document and commits staging", async () => {
        // Setup Staging Doc
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ 
                documentId: 'doc_123',
                aiResult: { provenanceId: 'prov_abc' }
            })
        });

        await ReconciliationService.approveExtraction('tenant-1', 'staging_1', 'user_1', { grade: 'A' });

        // Check if updateDoc was called with committed status
        // We filter calls to check if *one* of them was the staging commit
        const stagingCall = mockUpdateDoc.mock.calls.find(call => call[1].status === 'committed');
        expect(stagingCall).toBeDefined();
        expect(stagingCall[1]).toMatchObject({ status: 'committed', reviewedBy: 'user_1' });

        // Check document publish
        const publishCall = mockUpdateDoc.mock.calls.find(call => call[1].status === 'published');
        expect(publishCall).toBeDefined();
    });

    test("requestEPPReview updates status", async () => {
        await ReconciliationService.requestEPPReview('tenant-1', 'staging_1', 'Help', 'user_1');
        
        expect(mockUpdateDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ status: 'pending_approval' })
        );
    });
});
