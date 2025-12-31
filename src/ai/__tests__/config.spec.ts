// src/ai/__tests__/config.spec.ts

import { FLOW_PARAMS, DEFAULT_MODEL } from '../config';

describe('AI Config Policy', () => {
    
    test('Default model is set', () => {
        expect(DEFAULT_MODEL).toBeDefined();
        expect(typeof DEFAULT_MODEL).toBe('string');
    });

    test('Risk/Insight flow uses 0 temperature', () => {
        const params = FLOW_PARAMS.consultationInsights;
        expect(params.temperature).toBe(0.0);
        expect(params.maxOutputTokens).toBeLessThanOrEqual(1024); // Short output constraint
    });

    test('Clinical Report flow uses 0 temperature and large tokens', () => {
        const params = FLOW_PARAMS.consultationReport;
        expect(params.temperature).toBe(0.0);
        expect(params.maxOutputTokens).toBeGreaterThan(2000);
    });

    test('Creative flow allows temperature', () => {
        const params = FLOW_PARAMS.creativeSuggestions;
        expect(params.temperature).toBeGreaterThan(0.0);
    });
});
