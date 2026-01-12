// functions/src/ai/utils/model-selector.ts

import * as admin from 'firebase-admin';
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

// Cache config in memory (warm start optimization)
let cachedConfig: Record<string, string> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Hardcoded defaults match src/ai/config.ts
// UPDATED: Using explicit version 'gemini-2.0-flash' to avoid 404 on aliases in some regions
const DEFAULTS: Record<string, string> = {
    consultationInsights: 'googleai/gemini-2.5-flash',
    consultationReport: 'googleai/gemini-2.5-flash',
    assessmentGrading: 'googleai/gemini-2.0-flash',
    govIntel: 'googleai/gemini-2.0-flash', 
    documentExtraction: 'googleai/gemini-2.0-flash',
    general: 'googleai/gemini-2.0-flash'
};

export async function getModelForFeature(featureKey: string): Promise<string> {
    const now = Date.now();

    if (!cachedConfig || (now - lastFetchTime > CACHE_TTL)) {
        try {
            console.log("Fetching AI Model Config...");
            const snap = await db.doc("organization_settings/ai_models").get();
            if (snap.exists) {
                cachedConfig = snap.data()?.models || {};
            } else {
                cachedConfig = {};
            }
            lastFetchTime = now;
        } catch (e) {
            console.warn("Failed to fetch AI config, using defaults", e);
            cachedConfig = {};
        }
    }

    const selected = cachedConfig?.[featureKey] || DEFAULTS[featureKey] || DEFAULTS.general;
    return selected;
}

export async function getGenkitInstance(featureKey: string) {
    const modelName = await getModelForFeature(featureKey);
    // Map googleai/ prefix to clean model name if needed, or pass as is
    const cleanModelName = modelName.replace('googleai/', '');
    
    return genkit({
        plugins: [googleAI()],
        model: cleanModelName
    });
}
