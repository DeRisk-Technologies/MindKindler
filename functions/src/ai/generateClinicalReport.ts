// functions/src/ai/generateClinicalReport.ts

import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { applyGlossaryToStructured } from "./utils/glossarySafeApply";
import { buildSystemPrompt } from "./utils/prompt-builder";
import { getGenkitInstance } from "./utils/model-selector"; // Updated Import

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Expanded Schema matching Editor requirements
const EditorSectionSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string() // Markdown/HTML compatible text
});

const ClinicalReportOutputSchema = z.object({
    sections: z.array(EditorSectionSchema)
});

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

    const { 
        tenantId, 
        studentId, 
        studentName,
        age,
        templateType, // 'consultation' | 'statutory'
        notes, 
        history, 
        evidence, // Array of { id, type, snippet, trust }
        locale, 
        glossary 
    } = request.data;
    
    const userId = request.auth.uid;
    const startTime = Date.now();

    // 0. Initialize AI with Configured Model
    const ai = await getGenkitInstance('consultationReport');

    // 1. Construct System Prompt
    const baseInstruction = `You are an expert Educational Psychologist assistant. 
    Task: Draft a formal clinical report for student "${studentName}" (Age: ${age || 'Unknown'}).
    Template: ${templateType || 'Standard Consultation'}.
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.
    Style: Professional, Objective, Evidence-Based, Empathetic.
    
    Citation Rule: When making a claim supported by provided evidence, append a citation token like [[cite:evidenceId]].`;

    const aiContext = {
        locale: locale || 'en-GB',
        languageLabel: locale === 'fr-FR' ? 'French' : 'English (UK)',
        glossary: glossary || {}
    };

    const systemPrompt = buildSystemPrompt(baseInstruction, aiContext);

    // 2. Construct User Prompt with Data
    const evidenceBlock = evidence && evidence.length > 0 
        ? `### Verified Evidence (Cite these using [[cite:ID]])\n` + 
          evidence.map((e: any) => `- [${e.id}] (${e.type}): "${e.snippet}" (Trust: ${e.trust})`).join('\n')
        : "No specific evidence items linked.";

    const dataBlock = `
    ### Clinical Notes
    ${notes || "No notes provided."}

    ### Background History
    ${history || "No history provided."}

    ${evidenceBlock}
    `;

    const fullPrompt = `${systemPrompt}\n\n${dataBlock}\n\nGenerate the JSON report structure now.`;

    const config = { temperature: 0.0, maxOutputTokens: 4096 };

    const runGeneration = async (prompt: string) => {
        const { output } = await ai.generate({ prompt, config });
        const text = output?.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return { text, parsed: JSON.parse(cleanJson) };
    };

    let result;
    try {
        result = await runGeneration(fullPrompt);
        // Validate Structure
        ClinicalReportOutputSchema.parse(result.parsed);
    } catch (err: any) {
        console.warn(`Validation failed: ${err.message}. Attempting repair.`);
        try {
            const repairPrompt = `Previous JSON was invalid: ${err.message}. Fix the JSON structure to match { sections: [{ id, title, content }] }. Return ONLY JSON.`;
            result = await runGeneration(repairPrompt);
            ClinicalReportOutputSchema.parse(result.parsed);
        } catch (finalErr) {
             console.error("Repair failed", finalErr);
             // Fallback to error section
             result = { 
                 text: result?.text || "Error", 
                 parsed: { 
                     sections: [{ 
                         id: 'error', 
                         title: 'Generation Error', 
                         content: 'The AI could not generate a valid structure. Please review raw output in provenance logs.' 
                     }] 
                 } 
            };
        }
    }

    // 3. Post-Process: Glossary Enforcement
    let glossaryReplacements = 0;
    if (glossary) {
        const { artifact, replacements } = applyGlossaryToStructured(result.parsed, glossary, ['sections[].content', 'sections[].title']);
        result.parsed = artifact;
        glossaryReplacements = replacements;
    }

    // 4. Save Provenance
    // Note: We need to know WHICH model was actually selected for the log.
    // Ideally getGenkitInstance returns the model name too, or we re-fetch it.
    // For now logging 'configured-model' placeholder or re-fetching.
    const usedModel = await import("./utils/model-selector").then(m => m.getModelForFeature('consultationReport'));
    
    await saveAiProvenance({
        tenantId: tenantId || 'global',
        studentId: studentId,
        flowName: 'generateClinicalReport',
        prompt: fullPrompt,
        model: usedModel,
        responseText: result.text,
        parsedOutput: { ...result.parsed, glossaryReplacements },
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    if (db) { /* keep linter happy */ }

    return result.parsed;
};
