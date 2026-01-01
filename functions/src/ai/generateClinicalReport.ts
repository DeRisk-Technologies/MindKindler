import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { applyGlossaryToStructured } from "../src/ai/utils/glossarySafeApply";

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();

// Initialize Genkit
const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-pro",
});

interface GenerateReportInput {
    transcript: string;
    notes: string;
    history: string;
    templateType: string;
    studentId?: string;
    tenantId?: string;
    glossary?: Record<string, string>;
}

// Validation Schema
const ConsultationReportOutputSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })),
  summary: z.string(),
  suggestedDiagnoses: z.array(z.string()).optional(),
  plan: z.array(z.string()).optional(),
});

// Params from Config
const FLOW_PARAMS = {
    consultationReport: { 
        temperature: 0.0, 
        maxOutputTokens: 4096, 
        topK: 1
    }
};

export const handler = async (request: CallableRequest<GenerateReportInput>) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { transcript, notes, history, templateType, studentId, tenantId, glossary } = request.data;
    const userId = request.auth.uid;
    const effectiveTenantId = tenantId || 'global';
    
    const startTime = Date.now();

    const promptText = `
        You are an expert educational psychologist. Write a clinical consultation report in ${templateType} format.
        ... (Prompt logic matches previous step) ...
    `;

    const modelParams = FLOW_PARAMS.consultationReport;

    const runGeneration = async (prompt: string, attempt: number) => {
        const { output } = await ai.generate({
            prompt: prompt,
            config: modelParams
        });
        const text = output?.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        const validated = ConsultationReportOutputSchema.parse(parsed); 
        return { text, parsed: validated };
    };

    try {
        let result;
        try {
            result = await runGeneration(promptText, 1);
        } catch (err: any) {
            console.warn("Attempt 1 failed. Retrying...", err.message);
            // ... (Repair logic matches previous step) ...
            // Re-run
            const repairPrompt = `Fix JSON: ${err.message}`;
            result = await runGeneration(repairPrompt, 2);
        }

        // Glossary Enforcement
        let glossaryReplacements = 0;
        if (glossary) {
            // Apply to specific fields
            const { artifact, replacements } = applyGlossaryToStructured(result.parsed, glossary, [
                'title', 
                'sections[].content', 
                'summary', 
                'plan[]',
                'suggestedDiagnoses[]'
            ]);
            result.parsed = artifact;
            glossaryReplacements = replacements;
        }

        await saveAiProvenance({
            tenantId: effectiveTenantId,
            studentId,
            flowName: 'generateClinicalReport',
            prompt: promptText,
            model: 'googleai/gemini-pro',
            params: modelParams,
            responseText: result.text,
            parsedOutput: { ...result.parsed, glossaryReplacements },
            latencyMs: Date.now() - startTime,
            createdBy: userId
        });

        return result.parsed;

    } catch (error: any) {
        // ... (Error handling logic) ...
        throw new functions.https.HttpsError('internal', error.message);
    }
};
