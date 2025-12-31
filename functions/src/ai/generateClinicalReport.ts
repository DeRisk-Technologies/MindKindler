import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";

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

// Duplicated from shared config for Cloud Functions isolation
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

    const { transcript, notes, history, templateType, studentId, tenantId } = request.data;
    const userId = request.auth.uid;
    const effectiveTenantId = tenantId || 'global';
    
    const startTime = Date.now();

    const promptText = `
        You are an expert educational psychologist. Write a clinical consultation report in ${templateType} format.
        
        Session Transcript: "${transcript}"
        Clinician Notes: "${notes}"
        Patient History: "${history}"
        
        Output valid JSON with the following structure:
        {
            "title": "Consultation Report",
            "sections": [
                { "title": "Subjective", "content": "..." },
                { "title": "Objective", "content": "..." },
                { "title": "Assessment", "content": "..." },
                { "title": "Plan", "content": "..." }
            ],
            "summary": "...",
            "suggestedDiagnoses": ["..."],
            "plan": ["..."]
        }
    `;

    // Standardized Params from Config
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
        // Attempt 1
        let result;
        try {
            result = await runGeneration(promptText, 1);
        } catch (err: any) {
            console.warn("Attempt 1 failed validation/parsing. Trying repair...", err.message);
            
            const repairPrompt = `
                The previous JSON output was invalid. Please regenerate the JSON strictly adhering to this schema for a consultation report.
                Previous Input Context: Transcript length: ${transcript.length} chars
                Error: ${err.message}
                Task: Output ONLY valid JSON.
            `;
            
            await saveAiProvenance({
                tenantId: effectiveTenantId,
                studentId,
                flowName: 'generateClinicalReport',
                prompt: promptText,
                model: 'googleai/gemini-pro',
                params: modelParams,
                responseText: err.response || "No text",
                parsedOutput: { error: err.message, attempt: 1 },
                latencyMs: Date.now() - startTime,
                createdBy: userId
            });

            result = await runGeneration(repairPrompt, 2);
        }

        await saveAiProvenance({
            tenantId: effectiveTenantId,
            studentId,
            flowName: 'generateClinicalReport',
            prompt: promptText,
            model: 'googleai/gemini-pro',
            params: modelParams,
            responseText: result.text,
            parsedOutput: result.parsed,
            latencyMs: Date.now() - startTime,
            createdBy: userId
        });

        return result.parsed;

    } catch (error: any) {
        console.error("AI Error (Final)", error);
        
        await saveAiProvenance({
            tenantId: effectiveTenantId,
            studentId,
            flowName: 'generateClinicalReport',
            prompt: promptText,
            model: 'googleai/gemini-pro',
            params: modelParams,
            responseText: error.response || "No output",
            parsedOutput: { error: error.message, fatal: true },
            latencyMs: Date.now() - startTime,
            createdBy: userId
        });

        throw new functions.https.HttpsError('internal', error.message);
    }
};
