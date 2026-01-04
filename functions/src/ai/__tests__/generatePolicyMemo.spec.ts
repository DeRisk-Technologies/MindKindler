// functions/src/ai/__tests__/generatePolicyMemo.spec.ts

// Mock dependencies
const mockGenerate = jest.fn();
jest.mock("genkit", () => ({
    genkit: () => ({
        generate: mockGenerate
    })
}));

jest.mock("@genkit-ai/google-genai", () => ({
    googleAI: jest.fn()
}));

const mockRetrieveContext = jest.fn();
jest.mock("../knowledge/retrieve", () => ({
    retrieveContext: mockRetrieveContext
}));

const mockSaveAiProvenance = jest.fn();
jest.mock("../utils/provenance", () => ({
    saveAiProvenance: mockSaveAiProvenance
}));

import { generatePolicyMemoFlow } from "../flows/generatePolicyMemo";

describe("generatePolicyMemo Flow", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("generates structured memo with citations", async () => {
        // Setup RAG Mock
        mockRetrieveContext.mockResolvedValue([
            { id: 'doc_1', text: 'Rule 1: Always check attendance.' },
            { id: 'doc_2', text: 'Guideline B: Budget cap is 1M.' }
        ]);

        // Setup LLM Mock
        const mockMemo = {
            title: "Policy Brief",
            executiveSummary: "Summary text.",
            findings: [],
            recommendations: [],
            citationIds: ['doc_1']
        };
        mockGenerate.mockResolvedValue({ output: { text: JSON.stringify(mockMemo) } });

        const result = await generatePolicyMemoFlow('t1', { metric: 100 }, 'Safeguarding', 'user1');

        expect(result.title).toBe("Policy Brief");
        expect(mockRetrieveContext).toHaveBeenCalledWith('t1', expect.stringContaining('Safeguarding'), 5);
        expect(result.citations).toHaveLength(1); // Filtered by what AI used
        expect(result.citations[0].id).toBe('doc_1');
    });
});
