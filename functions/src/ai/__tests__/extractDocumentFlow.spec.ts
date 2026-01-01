// functions/src/ai/__tests__/extractDocumentFlow.spec.ts

import * as admin from 'firebase-admin';

// Mock Dependencies
const mockGenerate = jest.fn();
jest.mock("genkit", () => ({
    genkit: () => ({
        generate: mockGenerate
    })
}));

jest.mock("@genkit-ai/google-genai", () => ({
    googleAI: jest.fn()
}));

const mockAdd = jest.fn();
jest.mock("firebase-admin", () => ({
    apps: ['mock'],
    initializeApp: jest.fn(),
    firestore: Object.assign(
        () => ({
             collection: () => ({ add: mockAdd })
        }),
        { FieldValue: { serverTimestamp: jest.fn().mockReturnValue('MOCK_TIME') } }
    )
}));

import { runExtraction } from '../flows/extractDocumentFlow';

describe("runExtraction Flow", () => {
    
    beforeEach(() => {
        mockGenerate.mockReset();
        mockAdd.mockReset();
        mockAdd.mockResolvedValue({ id: 'prov_123' }); // Provenance ID
    });

    it("extracts academic record correctly", async () => {
        const mockResponse = {
            subjects: [{ name: "Math", grade: "A", score: 95 }],
            term: "Fall 2023"
        };
        
        mockGenerate.mockResolvedValue({ 
            output: { text: JSON.stringify(mockResponse) } 
        });

        const result = await runExtraction('tenant-1', 'Report Card Text...', 'academic_record', {}, 'user-1');

        expect(result.data.term).toBe("Fall 2023");
        expect(result.data.subjects).toHaveLength(1);
        expect(mockGenerate).toHaveBeenCalled();
        // Provenance save involves firestore add
        expect(mockAdd).toHaveBeenCalled(); 
    });

    it("applies glossary replacements", async () => {
        const mockResponse = {
            summary: "The student has good attendance.",
            keyEntities: [],
            dates: []
        };
        
        mockGenerate.mockResolvedValue({ 
            output: { text: JSON.stringify(mockResponse) } 
        });

        const result = await runExtraction('tenant-1', 'Text...', 'other', { "Student": "Learner" }, 'user-1');

        // Note: applyGlossaryToStructured runs post-generation on string values
        expect(result.data.summary).toContain("Learner");
    });
});
