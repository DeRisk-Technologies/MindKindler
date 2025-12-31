// functions/src/ai/__tests__/provenance.spec.ts

// Jest hoists jest.mock, but local variables are not hoisted inside the factory unless named with 'mock' prefix in some versions,
// or we must define the factory inline entirely.

const mockAdd = jest.fn();
const mockCollection = jest.fn(() => ({ add: mockAdd }));
const mockFirestore = jest.fn(() => ({ collection: mockCollection }));

jest.mock('firebase-admin', () => {
    return {
        apps: [],
        initializeApp: jest.fn(),
        firestore: () => ({
            collection: mockCollection
        })
    };
});

import * as admin from 'firebase-admin';
import { saveAiProvenance, AiProvenanceMeta } from '../utils/provenance';

// Mock ServerTimestamp
(admin.firestore as any).FieldValue = {
    serverTimestamp: () => 'MOCK_TIMESTAMP'
};

describe('AI Provenance Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('saveAiProvenance writes to ai_provenance collection', async () => {
        const meta: AiProvenanceMeta = {
            tenantId: 'tenant-123',
            flowName: 'testFlow',
            model: 'gemini-pro',
            prompt: 'Hello',
            responseText: 'World',
            latencyMs: 100,
            createdBy: 'user-abc'
        };

        await saveAiProvenance(meta);

        expect(mockCollection).toHaveBeenCalledWith('ai_provenance');
        expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
            tenantId: 'tenant-123',
            prompt: 'Hello',
            createdAt: 'MOCK_TIMESTAMP'
        }));
    });

    test('saveAiProvenance handles errors gracefully', async () => {
        mockAdd.mockRejectedValueOnce(new Error("Firestore error"));
        
        // Should not throw
        await expect(saveAiProvenance({} as any)).resolves.not.toThrow();
    });
});
