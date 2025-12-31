import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { runRiskRegex } from "./utils/risk";
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Use same config if possible, or define locally if shared code not available in functions context easily
// Ideally we share 'src/ai/config.ts' but functions has separate build. 
// For Stage 5, we duplicate the config CONSTANTS here to ensure deterministic behavior.
const FLOW_PARAMS = {
    consultationInsights: { 
        temperature: 0.0, 
        maxOutputTokens: 512,
        topK: 1,
        topP: 0.1
    }
};

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-1.5-flash",
});

// Validation Schema
const InsightSchema = z.object({
    type: z.enum(['risk', 'observation', 'none', 'diagnosis', 'treatment']),
    text: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    rationale: z.string().optional()
});

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

    const { transcriptChunk, context: inputContext, tenantId, studentId } = request.data;
    const userId = request.auth.uid;
    const effectiveTenantId = tenantId || 'global';
    
    const startTime = Date.now();

    // 1. Deterministic Risk Check
    const riskCheck = runRiskRegex(transcriptChunk);
    
    if (riskCheck.found) {
        try {
            const collectionPath = effectiveTenantId === 'global' ? 'cases' : `tenants/${effectiveTenantId}/cases`;
            await db.collection(collectionPath).add({
                type: 'student',
                subjectId: studentId || 'unknown',
                title: 'Immediate risk detected (deterministic)',
                severity: 'critical',
                status: 'open',
                createdBy: 'system',
                evidence: {
                    matches: riskCheck.matches,
                    snippet: transcriptChunk.substring(0, 200)
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Critical: Failed to create risk case", error);
        }
    }

    // 2. AI Enrichment
    const promptText = `Analyze this transcript chunk for immediate risks (self-harm, abuse) or key clinical observations.
    Context: ${inputContext}
    Chunk: "${transcriptChunk}"
    
    If you detect risk, explain why.
    Return JSON: { "type": "risk" | "observation" | "none", "text": "...", "confidence": "high" | "low", "rationale": "..." }`;

    const modelParams = FLOW_PARAMS.consultationInsights; // Updated to use strict params

    const runGeneration = async (prompt: string) => {
        const { output } = await ai.generate({ prompt, config: modelParams });
        const text = output?.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        const validated = InsightSchema.parse(parsed);
        return { text, parsed: validated };
    };

    let result;
    try {
        result = await runGeneration(promptText);
    } catch (err: any) {
        console.warn("Analysis attempt 1 failed validation. Retrying...");
        try {
            const repairPrompt = `Previous output invalid: ${err.message}. fix JSON structure. Return { "type": "...", "text": "...", "confidence": "..." }`;
            result = await runGeneration(repairPrompt);
        } catch (finalErr) {
             // Fallback for insights analysis - don't crash, just log error
             result = { text: "Error", parsed: { type: 'none', text: 'Analysis failed', confidence: 'low' } };
        }
    }

    // 3. AI-Based Escalation
    if (result.parsed.type === 'risk' && result.parsed.confidence === 'high' && !riskCheck.found) {
         try {
             const collectionPath = effectiveTenantId === 'global' ? 'cases' : `tenants/${effectiveTenantId}/cases`;
             await db.collection(collectionPath).add({
                type: 'student',
                subjectId: studentId || 'unknown',
                title: 'Immediate risk detected (AI)',
                severity: 'critical',
                status: 'open',
                createdBy: 'system',
                evidence: {
                    aiRationale: result.parsed.rationale,
                    snippet: transcriptChunk.substring(0, 200)
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp()
             });
         } catch (e) {
             console.error("Failed to create AI risk case", e);
         }
    }

    // 4. Save Provenance
    await saveAiProvenance({
        tenantId: effectiveTenantId,
        studentId: studentId,
        flowName: 'analyzeConsultationInsight',
        prompt: promptText,
        model: 'googleai/gemini-1.5-flash',
        responseText: result.text,
        parsedOutput: result.parsed,
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return result.parsed;
};
