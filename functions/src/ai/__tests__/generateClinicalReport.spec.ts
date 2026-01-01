// functions/src/ai/__tests__/generateClinicalReport.spec.ts (Fixed Mocks)

import * as admin from 'firebase-admin';

// Mock dependencies
jest.mock("firebase-admin", () => ({
    apps: ['mockApp'],
    initializeApp: jest.fn(),
    firestore: Object.assign(
        () => ({
             collection: jest.fn().mockReturnThis(),
             add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' })
        }),
        { FieldValue: { serverTimestamp: jest.fn().mockReturnValue('MOCK_TIMESTAMP') } }
    )
}));

// We need to define the mock *before* the test runs so the handler imports it correctly.
const mockGenerate = jest.fn();

jest.mock("genkit", () => ({
    genkit: () => ({
        generate: mockGenerate
    })
}));

jest.mock("@genkit-ai/google-genai", () => ({
    googleAI: jest.fn()
}));

// Import handler after mocks
import { handler } from "../generateClinicalReport";

describe("generateClinicalReport Cloud Function", () => {
    
    beforeEach(() => {
        mockGenerate.mockReset();
        // Default success
        mockGenerate.mockResolvedValue({ 
            output: { 
                text: JSON.stringify({ 
                    sections: [
                        { id: 'summary', title: 'Summary', content: 'Test Summary content.' }
                    ] 
                }) 
            } 
        });
    });

    const mockRequest = (data: any) => ({
        auth: { uid: 'user-123' },
        data: {
            tenantId: 'tenant-abc',
            studentId: 'student-xyz',
            studentName: 'Test Student',
            ...data
        }
    } as any);

    it("should generate valid structured report sections", async () => {
        const result = await handler(mockRequest({
            notes: "Test notes",
            locale: "en-GB"
        }));

        expect(result).toHaveProperty('sections');
        expect(result.sections[0].id).toBe('summary');
    });

    it("should attempt repair on malformed JSON", async () => {
        // 1. First call fails (bad JSON)
        // 2. Second call (repair) succeeds
        mockGenerate
            .mockResolvedValueOnce({ output: { text: "Bad JSON" } })
            .mockResolvedValueOnce({ output: { text: JSON.stringify({ sections: [{ id: 'repaired', title: 'Repaired', content: 'Fixed' }] }) } });

        const result = await handler(mockRequest({ notes: "Trigger Repair" }));
        
        expect(result.sections[0].id).toBe('repaired'); 
    });

    it("should apply glossary replacements", async () => {
        // Reset default mock to ensure clear state
        mockGenerate.mockResolvedValue({ 
            output: { 
                text: JSON.stringify({ 
                    sections: [
                        { id: 'summary', title: 'Summary', content: 'Test Summary content.' }
                    ] 
                }) 
            } 
        });

        const result = await handler(mockRequest({
            notes: "Test",
            glossary: { "Summary": "Overview" } 
        }));

        // The glossary replacement logic runs POST generation on the JSON object.
        // If glossary = { "Summary": "Overview" }, and the AI returns { title: "Summary" }
        // The applyGlossaryToStructured function should swap it.
        
        // Wait, applyGlossaryToStructured usually targets *content* fields. 
        // Let's check the handler code to see if 'title' is targeted.
        // Handler says: applyGlossaryToStructured(..., ['sections[].content', 'sections[].title'])
        // So yes, title should be replaced.
        
        expect(result.sections[0].title).toBe('Overview');
    });

});
