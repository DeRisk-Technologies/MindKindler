// functions/src/ai/__tests__/risk.spec.ts

import { runRiskRegex } from '../utils/risk';

describe('Risk Regex Logic', () => {
    test('detects suicide keywords', () => {
        const text = "I feel suicidal sometimes.";
        const result = runRiskRegex(text);
        expect(result.found).toBe(true);
        expect(result.matches[0].match).toMatch(/suicidal/i);
    });

    test('detects self-harm keywords', () => {
        const text = "He mentioned self-harm during the session.";
        const result = runRiskRegex(text);
        expect(result.found).toBe(true);
    });

    test('detects abuse tokens', () => {
        const text = "She said her uncle touched her and it was sexual abuse.";
        const result = runRiskRegex(text);
        expect(result.found).toBe(true);
        expect(result.matches.some(m => m.match.toLowerCase().includes('abuse'))).toBe(true);
    });

    test('ignores benign text', () => {
        const text = "The student is struggling with math and reading.";
        const result = runRiskRegex(text);
        expect(result.found).toBe(false);
    });

    test('handles empty input', () => {
        const result = runRiskRegex("");
        expect(result.found).toBe(false);
    });
});
