// src/ai/guardian/triggers.ts

/**
 * Triggers for Guardian Rules.
 * Expanded for Student 360 Privacy Sprint.
 */

// Basic PII Patterns
const PII_PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    PHONE: /(\+\d{1,3}[- ]?)?\d{10}/,
    SSN: /\d{3}-\d{2}-\d{4}/, // Generic ID pattern
    NHS: /\d{3} \d{3} \d{4}/
};

const SAFEGUARDING_KEYWORDS = [
    'abuse', 'self-harm', 'suicide', 'neglect', 'violence', 'weapon', 'threat', 'assault'
];

/**
 * Check if the context contains required consent for the action.
 * @param context e.g. { action: 'share', category: 'health', consents: ConsentRecord[] }
 */
export function checkConsent(context: any): string | null {
    if (!context || !context.consents) return "Missing consent context.";

    const { action, category, consents } = context;

    // Filter applicable consents
    const validConsent = consents.find((c: any) => 
        c.category === category && 
        c.status === 'granted' &&
        (c.expiresAt ? new Date(c.expiresAt) > new Date() : true)
    );

    if (!validConsent) {
        return `No valid consent found for '${category}' (Action: ${action}).`;
    }

    return null;
}

/**
 * Check for generic metadata completeness.
 */
export function checkMetadata(context: any): string | null {
    if (!context.metadata || !context.metadata.source) {
        return "Missing source provenance metadata.";
    }
    return null;
}

/**
 * Check for PII leakage in unstructured text (e.g. AI Output).
 */
export function checkPII(context: any): string | null {
    const text = context.content || JSON.stringify(context);
    
    // Very basic check - in production use Named Entity Recognition (NER)
    if (PII_PATTERNS.EMAIL.test(text)) return "Potential Email address detected in output.";
    if (PII_PATTERNS.PHONE.test(text)) return "Potential Phone number detected in output.";
    
    return null;
}

/**
 * Check for Safeguarding keywords in text.
 */
export function checkSafeguarding(context: any): string | null {
    const text = (context.content || "").toLowerCase();
    
    const found = SAFEGUARDING_KEYWORDS.filter(w => text.includes(w));
    if (found.length > 0) {
        return `Safeguarding keyword(s) detected: ${found.join(', ')}. Immediate review required.`;
    }
    return null;
}
