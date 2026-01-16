// src/lib/ai/clerk-agent.ts (UPDATED)

import { IngestionAnalysis } from "../../types/evidence";
import { functions } from "@/lib/firebase"; // Client SDK
import { httpsCallable } from "firebase/functions";

export class ClerkAgent {
    async analyzeDocument(text: string, fileName: string): Promise<IngestionAnalysis> {
        try {
            console.log(`[ClerkAgent] Sending ${fileName} to Cloud Function...`);
            
            const analyzeFn = httpsCallable(functions, 'analyzeDocument'); // Call REAL Function
            const result = await analyzeFn({ text, fileName });
            
            const data = result.data as any;
            return data.analysis as IngestionAnalysis;

        } catch (error) {
            console.error("Cloud Analysis Failed, falling back to basic extraction:", error);
            // Fallback for offline/error handling
            return {
                fileId: 'error',
                extractedStakeholders: [],
                detectedDates: [],
                suggestedCategory: 'other',
                confidence: 0,
                riskSignals: ['AI Service Unavailable'],
                summary: "Analysis failed."
            };
        }
    }
}
