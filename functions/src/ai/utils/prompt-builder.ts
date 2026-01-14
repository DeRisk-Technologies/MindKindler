// functions/src/ai/utils/prompt-builder.ts

export interface AIContext {
    locale: string;
    languageLabel: string; // e.g., "English (UK)", "French"
    glossary?: Record<string, string>;
    reportType?: 'statutory' | 'consultation' | 'referral';
}

export const buildSystemPrompt = (baseInstruction: string, context: AIContext): string => {
    let prompt = `${baseInstruction}\n\n`;

    // 1. Language Instruction
    prompt += `### Language & Tone\n`;
    prompt += `- Respond strictly in ${context.languageLabel} (${context.locale}).\n`;
    prompt += `- Tone: Professional, Clinical, Empathetic, Safeguarding-Aware.\n`;

    // 2. Glossary Integration
    if (context.glossary && Object.keys(context.glossary).length > 0) {
        prompt += `\n### Terminology & Glossary\n`;
        prompt += `Use the following preferred terms strictly:\n`;
        Object.entries(context.glossary).forEach(([canonical, preferred]) => {
            prompt += `- "${canonical}" → "${preferred}"\n`;
        });
    }

    // 3. Advanced Synthesis Rules (Phase 33: Deep Synthesis)
    // Triggers only for UK Statutory Reports (Appendix K) to ensure Triangulation
    const isUK = context.languageLabel.includes('UK') || context.locale === 'en-GB'; 
    
    if (isUK && context.reportType === 'statutory') {
        prompt += `\n### UK Statutory Reporting Standards (Appendix K)\n`;
        prompt += `You must structure the report to explicitly triangulate data sources:\n`;
        
        prompt += `\n[SECTION A: BACKGROUND & VIEWS]\n`;
        prompt += `- Incorporate details from the 'PARENT DATA' (One Page Profile) regarding early history, home behavior, and strengths.\n`;
        prompt += `- Ensure the "Voice of the Child" is prominent.\n`;
        
        prompt += `\n[SECTION B: EDUCATIONAL NEEDS]\n`;
        prompt += `- CONTRAST the 'Clinical Assessment Data' (Psychometrics) with the 'SCHOOL DATA' (Teacher View).\n`;
        prompt += `- CRITICAL: If psychometric scores are average but Teacher reports 'struggling' (or vice-versa), explicitly highlight this discrepancy as a specific area for investigation (e.g., "Performance discrepancy suggests potential masking or environmental barriers").\n`;
        
        prompt += `\n[SECTION F: PROVISION]\n`;
        prompt += `- If the 'SCHOOL DATA' lists 'Current Interventions', summarize their reported impact (or lack thereof) to justify new recommendations.\n`;
        prompt += `- Ensure provisions are specific and quantified (e.g., "Weekly small group support" rather than "Support").\n`;
    }

    return prompt;
};

/**
 * Deterministic post-processor to enforce glossary terms in text.
 * Useful for ensuring critical terms are swapped even if AI misses them.
 * Caution: Simple implementation, may affect subwords if not careful.
 */
export const applyGlossaryToText = (text: string, glossary: Record<string, string>): string => {
    if (!text || !glossary) return text;

    let processed = text;
    
    // Sort keys by length descending to prevent partial replacements of longer terms
    // e.g. replace "School District" before "School"
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);

    for (const term of terms) {
        const preferred = glossary[term];
        if (!term || !preferred) continue;

        // Create regex for whole word, case insensitive match
        // \b ensures word boundaries
        // gi ensures global case-insensitive
        try {
            // For special chars like C++, \b might not work as expected because + is not a word char.
            // If the term contains non-word characters, we might need to relax \b constraint on that side.
            
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
