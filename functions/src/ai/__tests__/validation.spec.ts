// functions/src/ai/__tests__/validation.spec.ts

import { z } from 'zod';

const ConsultationReportOutputSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })),
  summary: z.string(),
});

describe('AI Validation Logic', () => {
    
    test('Validates correct schema', () => {
        const valid = {
            title: "Report",
            sections: [{ title: "S", content: "..." }],
            summary: "Sum"
        };
        expect(() => ConsultationReportOutputSchema.parse(valid)).not.toThrow();
    });

    test('Throws on missing fields', () => {
        const invalid = {
            title: "Report"
            // Missing sections, summary
        };
        expect(() => ConsultationReportOutputSchema.parse(invalid)).toThrow();
    });

    test('Throws on wrong types', () => {
        const invalid = {
            title: "Report",
            sections: "Not an array",
            summary: "Sum"
        };
        expect(() => ConsultationReportOutputSchema.parse(invalid)).toThrow();
    });
});
