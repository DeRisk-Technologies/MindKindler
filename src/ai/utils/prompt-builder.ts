// src/ai/utils/prompt-builder.ts

import { GlossaryDoc } from "@/types/schema";
import { CountryPackConfig } from "@/marketplace/types";
import { ScoreResult } from "@/services/analytics/PsychometricEngine";

export interface AIContext {
    locale: string;
    languageLabel: string; // e.g., "English (UK)", "French"
    glossary?: Record<string, string>;
    countryPack?: CountryPackConfig; // NEW: Injected Country OS Config
}

export const buildSystemPrompt = (baseInstruction: string, context: AIContext): string => {
    let prompt = `${baseInstruction}\n\n`;

    // 1. Language Instruction
    prompt += `### Language & Tone\n`;
    prompt += `- Respond strictly in ${context.languageLabel} (${context.locale}).\n`;
    prompt += `- Tone: Professional, Clinical, Empathetic, Safeguarding-Aware.\n`;

    // 2. Country Specific Statutory Context (Phase 4)
    if (context.countryPack) {
        prompt += `\n### Statutory Framework & Legal Constraints (${context.countryPack.countryCode})\n`;
        
        // A. Statutory Guidelines (Research Section 1.3.1)
        if (context.countryPack.complianceWorkflows.some(w => w.name.includes("Graduated Approach"))) {
             prompt += `- You MUST structure your analysis according to the 'Graduated Approach' cycle: Assess, Plan, Do, Review.\n`;
             prompt += `- Cite the 'SEND Code of Practice' where relevant to identifying needs.\n`;
        }

        // B. Negative Constraints (Research Section 4.2.2)
        prompt += `\n### CRITICAL NEGATIVE CONSTRAINTS\n`;
        prompt += `- DO NOT make medical diagnoses (e.g. "Child has ADHD" or "Dyslexia"). Instead, describe the educational need (e.g. "Specific difficulty with phonological processing").\n`;
        prompt += `- NEVER be definitive about internal states. Use phrases like "The data suggests...", "Scores indicate...", or "It appears that...".\n`;
        prompt += `- DO NOT recommend medication or medical interventions.\n`;
    }

    // 3. Glossary Integration
    if (context.glossary && Object.keys(context.glossary).length > 0) {
        prompt += `\n### Terminology & Glossary\n`;
        prompt += `Use the following preferred terms strictly:\n`;
        Object.entries(context.glossary).forEach(([canonical, preferred]) => {
            prompt += `- "${canonical}" → "${preferred}"\n`;
        });
    }

    return prompt;
};

/**
 * Helper to format psychometric data for the LLM.
 * Implements Research Section 5.1 (Visualizing Uncertainty) textually.
 */
export const formatPsychometricDataForAI = (scores: ScoreResult[]): string => {
    let output = "### Clinical Assessment Data (Confidential)\n";
    
    scores.forEach(score => {
        // Format: "Verbal Comprehension (VCI): 85 (95% CI: 80-90) - Low Average"
        // This prevents the AI from treating '85' as a hard fact.
        output += `- ${score.classification} Range: Score ${score.standardScore} (95% Confidence Interval: ${score.confidenceInterval[0]}-${score.confidenceInterval[1]})\n`;
        
        if (score.isSignificantDeviation) {
            output += `  * ALERT: Significant Deviation detected (below clinical threshold).\n`;
        }
    });

    return output;
};

/**
 * Deterministic post-processor to enforce glossary terms in text.
 * Useful for ensuring critical terms are swapped even if AI misses them.
 */
export const applyGlossaryToText = (text: string, glossary: Record<string, string>): string => {
    if (!text || !glossary) return text;

    let processed = text;
    
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);

    for (const term of terms) {
        const preferred = glossary[term];
        if (!term || !preferred) continue;

        try {
            const isWordChar = (char: string) => /\w/.test(char);
            const startBoundary = isWordChar(term[0]) ? "\\b" : "";
            const endBoundary = isWordChar(term[term.length - 1]) ? "\\b" : "";

            const regex = new RegExp(`${startBoundary}${escapeRegExp(term)}${endBoundary}`, 'gi');
            processed = processed.replace(regex, (match) => {
                return preferred;
            });
        } catch (e) {
            console.warn(`Invalid regex for glossary term: ${term}`);
        }
    }

    return processed;
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}
