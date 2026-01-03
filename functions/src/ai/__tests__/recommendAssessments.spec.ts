// functions/src/ai/__tests__/recommendAssessments.spec.ts

const mockGenerate = jest.fn();
jest.mock("genkit", () => ({
    genkit: () => ({
        generate: mockGenerate
    })
}));

jest.mock("@genkit-ai/google-genai", () => ({
    googleAI: jest.fn()
}));

jest.mock("../knowledge/retrieve", () => ({
    retrieveContext: jest.fn().mockResolvedValue([{ text: "WISC-V: Cognitive test." }])
}));

import { recommendAssessmentsFlow } from "../flows/recommendAssessments";

describe("Recommend Assessments Flow", () => {
    
    it("returns gaps and recommendations", async () => {
        mockGenerate.mockResolvedValue({
            output: {
                text: JSON.stringify({
                    gaps: ["No cognitive data"],
                    recommendations: [{ templateId: "wisc5", title: "WISC-V", reasoning: "Fill gap.", confidence: "high" }]
                })
            }
        });

        const result = await recommendAssessmentsFlow("t1", "transcript", "notes");
        
        expect(result.gaps).toContain("No cognitive data");
        expect(result.recommendations).toHaveLength(1);
    });
});
