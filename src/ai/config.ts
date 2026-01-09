// src/ai/config.ts

export const AVAILABLE_MODELS = [
    { value: 'googleai/gemini-2.0-flash', label: 'Gemini 2.0 Flash', tags: ['Fast', 'Next-Gen'], tier: 'basic' },
    { value: 'googleai/gemini-2.0-flash-lite-preview-02-05', label: 'Gemini 2.0 Lite', tags: ['Ultra Fast'], tier: 'basic' },
    { value: 'googleai/gemini-1.5-pro', label: 'Gemini 1.5 Pro', tags: ['Deep Reasoning'], tier: 'standard' },
];

export const FEATURE_MODEL_DEFAULTS: Record<string, string> = {
    consultationInsights: 'googleai/gemini-2.0-flash',
    consultationReport: 'googleai/gemini-1.5-pro',
    assessmentGrading: 'googleai/gemini-1.5-pro',
    govIntel: 'googleai/gemini-1.5-pro',
    documentExtraction: 'googleai/gemini-2.0-flash', 
    general: 'googleai/gemini-2.0-flash'
};

export const FEATURE_METADATA: Record<string, { label: string, description: string, recommended: string }> = {
    consultationInsights: {
        label: "Consultation Insights",
        description: "Analyzes real-time transcripts for clinical risks and patterns.",
        recommended: 'googleai/gemini-2.0-flash'
    },
    consultationReport: {
        label: "Report Generation",
        description: "Drafts formal clinical documents and letters.",
        recommended: 'googleai/gemini-1.5-pro'
    },
    assessmentGrading: {
        label: "Assessment Grading",
        description: "Evaluates open-text student responses against rubrics.",
        recommended: 'googleai/gemini-1.5-pro'
    },
    govIntel: {
        label: "GovIntel Policy",
        description: "Synthesizes regional data into policy memos.",
        recommended: 'googleai/gemini-1.5-pro' 
    },
    documentExtraction: {
        label: "Document Extraction",
        description: "Extracts structured data from uploaded PDFs/Images.",
        recommended: 'googleai/gemini-2.0-flash'
    },
    general: {
        label: "General Tasks",
        description: "Summarization, translation, and helper chat.",
        recommended: 'googleai/gemini-2.0-flash'
    }
};

export const DEFAULT_MODEL = 'googleai/gemini-2.0-flash';

// Standardized Parameters for different AI Tasks
export const FLOW_PARAMS = {
    // Risk & Insights: Deterministic, concise, low hallucination risk
    consultationInsights: { 
        temperature: 0.0, 
        maxOutputTokens: 512,
        topK: 1,
        topP: 0.1
    },
    // Clinical Reports: Highly structured, consistent tone
    consultationReport: { 
        temperature: 0.0, 
        maxOutputTokens: 4096, // Reports can be long
        topK: 1
    },
    // Brainstorming: Slightly more creative
    creativeSuggestions: { 
        temperature: 0.25, 
        maxOutputTokens: 1024 
    }
};
