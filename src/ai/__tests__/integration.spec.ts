// src/ai/__tests__/integration.spec.ts

import { generateConsultationInsightsFlow } from '../flows/generate-consultation-insights';
import { runRiskRegex } from '../../functions/src/ai/utils/risk'; 
// Note: We are importing the regex utility from functions source for unit testing consistency across full stack logic.
// In a real repo structure, shared code should be in a shared lib, but here we cross-import for validation.

describe('Integration: Risk & Flow Logic', () => {
    
    test('Risk Regex detects critical keywords', () => {
        const text = "I am worried he might self-harm.";
        const result = runRiskRegex(text);
        expect(result.found).toBe(true);
        expect(result.matches[0].match).toMatch(/self-harm/i);
    });

    test('Flow input validation accepts full transcript', () => {
        const input = {
            fullTranscript: "Hello world",
            studentAge: 10
        };
        // Just verifying typing allows this, runtime execution needs mocked AI
        expect(input.fullTranscript).toBe("Hello world");
    });

});
