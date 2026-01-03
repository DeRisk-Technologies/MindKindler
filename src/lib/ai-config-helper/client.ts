// src/lib/ai-config-helper/client.ts

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FEATURE_MODEL_DEFAULTS } from "@/ai/config";

// Client-side helper to fetch model config
// Note: In most cases, the model choice is handled server-side in Cloud Functions.
// This helper is for client-side Genkit calls if any (mostly deprecated in favor of server calls).

export async function getModelForFeature(featureKey: string): Promise<string> {
    try {
        // Optimistic default
        const defaultModel = FEATURE_MODEL_DEFAULTS[featureKey] || FEATURE_MODEL_DEFAULTS.general;

        // Try fetch override
        // Cache this in LocalStorage or Context in a real app to avoid excessive reads
        const snap = await getDoc(doc(db, "organization_settings", "ai_models"));
        
        if (snap.exists()) {
            const models = snap.data().models;
            return models[featureKey] || defaultModel;
        }
        
        return defaultModel;
    } catch (e) {
        return FEATURE_MODEL_DEFAULTS[featureKey] || 'googleai/gemini-1.5-flash';
    }
}
