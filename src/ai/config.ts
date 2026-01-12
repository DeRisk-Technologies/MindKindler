// src/ai/config.ts

import { ai } from './genkit';

export const AVAILABLE_MODELS = [
    { value: 'googleai/gemini-2.0-flash', label: 'Gemini 2.0 Flash', tags: ['Fast', 'Next-Gen'], tier: 'basic' },
    { value: 'googleai/gemini-2.0-flash-lite-preview-02-05', label: 'Gemini 2.0 Lite', tags: ['Ultra Fast'], tier: 'basic' },
    { value: 'googleai/gemini-2.0-pro', label: 'Gemini 2.5 Pro', tags: ['Deep Reasoning'], tier: 'standard' },
];

export const FEATURE_MODEL_DEFAULTS: Record<string, string> = {
    consultationInsights: 'googleai/gemini-2.0-flash',
    consultationReport: 'googleai/gemini-2.0-flash', // SWAPPED to 2.0 Flash for Pilot Speed
    assessmentGrading: 'googleai/gemini-2.0-pro',
    govIntel: 'googleai/gemini-2.5-pro',
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
        recommended: 'googleai/gemini-2.0-flash'
    },
    assessmentGrading: {
        label: "Assessment Grading",
        description: "Evaluates open-text student responses against rubrics.",
        recommended: 'googleai/gemini-2.0-pro'
    },
    govIntel: {
        label: "GovIntel Policy",
        description: "Synthesizes regional data into policy memos.",
        recommended: 'googleai/gemini-2.5-pro' 
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
    consultationInsights: { 
        temperature: 0.0, 
        maxOutputTokens: 512,
        topK: 1,
        topP: 0.1
    },
    consultationReport: { 
        temperature: 0.2, // Slightly more natural flow than insights
        maxOutputTokens: 4096, 
        topK: 1
    },
    creativeSuggestions: { 
        temperature: 0.25, 
        maxOutputTokens: 1024 
    }
};

export async function generateContent(prompt: string, model: string = DEFAULT_MODEL) {
    throw new Error("Use src/app/actions/ai-actions.ts for server-side generation.");
}
