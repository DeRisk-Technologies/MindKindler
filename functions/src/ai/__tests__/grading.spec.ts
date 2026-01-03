// functions/src/ai/__tests__/grading.spec.ts

const mockGenerate = jest.fn();
jest.mock("genkit", () => ({
    genkit: () => ({
        generate: mockGenerate
    })
}));

jest.mock("@genkit-ai/google-genai", () => ({
    googleAI: jest.fn()
}));

const mockSaveAiProvenance = jest.fn();
jest.mock("../utils/provenance", () => ({
    saveAiProvenance: mockSaveAiProvenance
}));

import { scoreOpenTextResponseFlow } from "../flows/grading";

describe("Grading AI Flow", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("grades correctly within maxPoints", async () => {
        const mockOutput = {
            score: 8, // AI gives 8, max is 5 (edge case)
            reasoning: "Great job.",
            feedback: "Keep it up.",
            confidence: 'high'
        };
        mockGenerate.mockResolvedValue({ output: { text: JSON.stringify(mockOutput) } });

        const result = await scoreOpenTextResponseFlow('t1', 'Q1', 'Ans', null, 5, 'u1');

        expect(result.score).toBe(5); // Clamped
        expect(result.feedback).toBe("Keep it up.");
        expect(mockSaveAiProvenance).toHaveBeenCalled();
    });

    it("handles parsing errors gracefully", async () => {
        mockGenerate.mockResolvedValue({ output: { text: "Not JSON" } });
        
        const result = await scoreOpenTextResponseFlow('t1', 'Q1', 'Ans', null, 5, 'u1');
        
        expect(result.score).toBe(0);
        expect(result.confidence).toBe('low');
    });
});
