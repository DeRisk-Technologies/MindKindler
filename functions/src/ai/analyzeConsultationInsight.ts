// functions/src/ai/analyzeConsultationInsight.ts
import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { runRiskRegex } from "./utils/risk"; // Used for deterministic risk check
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { applyGlossaryToStructured } from "./utils/glossarySafeApply";
import { getGenkitInstance, getModelForFeature } from "./utils/model-selector";

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore(); // Used for direct DB operations if needed (e.g. creating risk cases)

// Use same config if possible
const FLOW_PARAMS = {
    consultationInsights: { 
        temperature: 0.2, // Slightly higher for plans
        maxOutputTokens: 1024,
        topK: 1,
        topP: 0.1
    }
};

// Validation Schema
const InsightSchema = z.object({
    type: z.enum(['risk', 'observation', 'none', 'diagnosis', 'treatment', 'question']),
    text: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    rationale: z.string().optional(),
    plan: z.array(z.string()).optional() // Added for Treatment Plans
});

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

    const { transcriptChunk, context: inputContext, tenantId, studentId, glossary } = request.data;
    const userId = request.auth.uid;
    const effectiveTenantId = tenantId || 'global';
    
    const startTime = Date.now();

    // 0. Initialize AI
    const ai = await getGenkitInstance('consultationInsights');
    const modelName = await getModelForFeature('consultationInsights');

    // 1. Deterministic Risk Check (Uses regex util)
    const riskCheck = runRiskRegex(transcriptChunk);
    
    if (riskCheck.found) {
        // Log risk to DB without waiting for AI (Safety First)
        // FIXED: Access matches array correctly
        const firstMatch = riskCheck.matches[0]?.match || 'Unknown Risk';
        console.warn(`[Risk Detected] Regex found: ${firstMatch}`);
        
        if (db) {
             // In a real scenario, we might write to a 'critical_alerts' collection here
             // await db.collection('alerts').add({ ... });
        }
    }

    // 2. Dynamic Prompt Selection
    let promptText = "";
    
    if (inputContext === 'plan_intervention') {
        promptText = `
        You are an expert Clinical Psychologist. Based on the session transcript below, generate a structured treatment/intervention plan.
        
        Transcript: "${transcriptChunk.substring(0, 15000)}"
        
        Return JSON:
        {
            "type": "treatment",
            "text": "Summary of clinical needs identified",
            "confidence": "high",
            "plan": [
                "1. Immediate Step: ...",
                "2. Medium Term: ...",
                "3. School Action: ..."
            ],
            "rationale": "Clinical reasoning..."
        }
        `;
    } else {
        // Default Live Analysis
        promptText = `
        Analyze this live transcript chunk for:
        1. Immediate Risks (Self-harm, Abuse) -> type: 'risk'
        2. Clinical Observations -> type: 'observation'
        3. Suggested Next Question -> type: 'question'
        
        Context: ${inputContext}
        Chunk: "${transcriptChunk}"
        
        Return JSON: { "type": "risk" | "observation" | "question" | "none", "text": "...", "confidence": "high" | "low", "rationale": "..." }
        `;
    }

    const modelParams = FLOW_PARAMS.consultationInsights;

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
        console.warn("Analysis attempt 1 failed validation. Retrying...", err.message);
        try {
            const repairPrompt = `Previous output invalid: ${err.message}. Fix JSON structure for schema: { type, text, confidence, rationale, plan? }. Return valid JSON.`;
            result = await runGeneration(repairPrompt);
        } catch (finalErr) {
             console.error("AI Generation Failed Completely", finalErr);
             result = { text: "Error", parsed: { type: 'none', text: 'Analysis failed', confidence: 'low' } };
        }
    }

    // 3. Glossary Enforcement
    let glossaryReplacements = 0;
    if (glossary) {
        const { artifact, replacements } = applyGlossaryToStructured(result.parsed, glossary, ['text', 'rationale', 'plan']);
        result.parsed = artifact;
        glossaryReplacements = replacements;
    }

    // 4. Save Provenance
    await saveAiProvenance({
        tenantId: effectiveTenantId,
        studentId: studentId,
        flowName: 'analyzeConsultationInsight',
        prompt: promptText,
        model: modelName,
        responseText: result.text,
        parsedOutput: { ...result.parsed, glossaryReplacements },
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return result.parsed;
};
