// functions/src/reports/utils/redaction.ts

import { ReportSection, RedactionLevel } from "../../types/schema";

export function applyRedaction(
    sections: ReportSection[], 
    level: RedactionLevel
): ReportSection[] {
    if (level === 'FULL') return sections;

    return sections.map(section => {
        // 1. Remove internal sections
        if (section.internalOnly) return null;

        // 2. Process content
        let redactedContent = section.content;

        if (level === 'ANONYMIZED') {
            // Replace generic PII patterns
            // Note: This is a simplistic deterministic check. 
            // Real production would use Google DLP API or similar.
            redactedContent = redactedContent
                .replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s[A-Z][a-z]+/g, '[REDACTED NAME]')
                .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[REDACTED DATE]');
        }
        
        // 3. Remove inline \"internal\" blocks if marked in text like [[internal]]...[[/internal]]
        // (Regex for non-greedy match between tags)
        redactedContent = redactedContent.replace(/\[\[internal\]\][\s\S]*?\[\[\/internal\]\]/gi, ' [REDACTED SECTION] ');

        return {
            ...section,
            content: redactedContent
        };
    }).filter((s): s is ReportSection => s !== null);
}
