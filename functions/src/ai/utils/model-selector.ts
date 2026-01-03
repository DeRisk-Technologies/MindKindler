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
const DEFAULTS: Record<string, string> = {
    consultationInsights: 'googleai/gemini-1.5-pro',
    consultationReport: 'googleai/gemini-1.5-pro',
    assessmentGrading: 'googleai/gemini-1.5-pro',
    govIntel: 'googleai/gemini-1.5-pro', // 2.5 is not yet GA in all regions, safe default
    documentExtraction: 'googleai/gemini-1.5-flash',
    general: 'googleai/gemini-1.5-pro'
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
    // console.log(`Feature [${featureKey}] using model [${selected}]`);
    return selected;
}

export async function getGenkitInstance(featureKey: string) {
    const modelName = await getModelForFeature(featureKey);
    return genkit({
        plugins: [googleAI()],
        model: modelName
    });
}
