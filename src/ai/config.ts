// src/ai/config.ts

export const DEFAULT_MODEL = 'googleai/gemini-1.5-flash';

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
