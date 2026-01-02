// src/services/audit/__tests__/audit-logger.spec.ts

import { AuditLogger } from "../audit-logger";

const mockAddDoc = jest.fn();

jest.mock("@/lib/firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    addDoc: (ref: any, data: any) => mockAddDoc(ref, data),
    serverTimestamp: () => 'MOCK_TIME'
}));

describe("AuditLogger", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("logDocumentAction writes immutable log", async () => {
        await AuditLogger.logDocumentAction('tenant-1', 'doc-1', 'approve', 'user-1', { extra: 'data' });
        
        expect(mockAddDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                type: 'approve',
                actorId: 'user-1',
                metadata: { extra: 'data' }
            })
        );
    });
});
