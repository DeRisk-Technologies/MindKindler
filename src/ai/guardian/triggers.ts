import { GuardianEvent, GuardianFinding } from "@/types/schema";

/**
 * Triggers Library
 * Deterministic checks for specific conditions.
 */

export function checkConsent(context: Record<string, any>): string | null {
    if (!context.consentObtained) {
        return "Consent record is missing for this action.";
    }
    return null;
}

export function checkMetadata(context: Record<string, any>): string | null {
    const required = context.requiredMetadata || [];
    const missing = required.filter((field: string) => !context[field]);
    if (missing.length > 0) {
        return `Missing required metadata: ${missing.join(", ")}.`;
    }
    return null;
}

export function checkPII(context: Record<string, any>): string | null {
    if (context.containsPII && context.visibility === 'public') {
        return "Public document contains PII flags.";
    }
    return null;
}

export function checkSafeguarding(context: Record<string, any>): string | null {
    // Simple Mock NLP for high-risk keywords
    const RISK_KEYWORDS = ["suicide", "self-harm", "abuse", "rape", "violence", "neglect", "trafficking", "kill"];
    const text = (context.text || "").toLowerCase();
    
    const matched = RISK_KEYWORDS.filter(k => text.includes(k));
    if (matched.length > 0) {
        return `High-risk content detected (keywords: ${matched.join(", ")}). A safeguarding incident report is recommended.`;
    }
    return null;
}
