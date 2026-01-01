// functions/src/reports/__tests__/redaction.spec.ts

import { applyRedaction } from '../utils/redaction';
import { ReportSection } from '../../types/schema';

describe('Redaction Logic', () => {
    
    const sections: ReportSection[] = [
        { id: '1', title: 'Public Info', content: 'Student name is John Doe.' },
        { id: '2', title: 'Internal Note', content: 'Discuss sensitive issue.', internalOnly: true },
        { id: '3', title: 'Mixed', content: 'Public part. [[internal]]Secret part[[/internal]]' }
    ];

    test('FULL level returns everything', () => {
        const result = applyRedaction(sections, 'FULL');
        expect(result).toHaveLength(3);
        expect(result[1].content).toContain('Discuss sensitive issue');
    });

    test('PARENT_SAFE removes internal sections and inline blocks', () => {
        const result = applyRedaction(sections, 'PARENT_SAFE');
        
        // Should filter out the internalOnly section
        expect(result).toHaveLength(2);
        expect(result.find(s => s.id === '2')).toBeUndefined();
        
        // Should redact inline tags
        const mixed = result.find(s => s.id === '3');
        expect(mixed?.content).toContain('[REDACTED SECTION]');
        expect(mixed?.content).not.toContain('Secret part');
    });

    test('ANONYMIZED replaces PII', () => {
        const piiSection: ReportSection = { id: '4', title: 'PII', content: 'Dr. Smith visited on 12/12/2023.' };
        const result = applyRedaction([piiSection], 'ANONYMIZED');
        
        expect(result[0].content).toContain('[REDACTED NAME]');
        expect(result[0].content).toContain('[REDACTED DATE]');
    });
});
