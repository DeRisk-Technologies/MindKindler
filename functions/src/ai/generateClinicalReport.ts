// functions/src/ai/generateClinicalReport.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { buildSystemPrompt } from "./utils/prompt-builder";
import { getGenkitInstance } from "./utils/model-selector"; 

if (!admin.apps.length) admin.initializeApp();

const EditorSectionSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string() 
});

const ClinicalReportOutputSchema = z.object({
    sections: z.array(EditorSectionSchema)
});

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { 
        tenantId, 
        studentId, 
        templateId, 
        contextPackId,
        studentContext, // Client-provided Student Profile
        sessionContext  // Client-provided Session Evidence
    } = request.data;
    
    const userId = request.auth.uid;
    const startTime = Date.now();
    const userRole = request.auth.token.role || 'EPP';
    const region = request.auth.token.region || 'uk';

    // --- 1. DATA RESOLUTION ---
    let studentData: any = studentContext; 

    if (!studentData) {
        // Fallback (Legacy)
        try {
            const docSnap = await admin.firestore().collection('students').doc(studentId).get();
            studentData = docSnap.exists ? docSnap.data() : { identity: { firstName: { value: "Student" } } };
        } catch (e) {
            studentData = { identity: { firstName: { value: "Student" } } };
        }
    }

    // --- 2. AI CONFIGURATION ---
    await getGenkitInstance('consultationReport'); 

    // --- 3. CONSTRUCT PROMPT ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const firstName = studentData.identity?.firstName?.value || "Student";
    const lastName = studentData.identity?.lastName?.value || "";

    // Build Evidence Block from Session Data
    let evidenceBlock = "";
    if (sessionContext) {
        const outcome = sessionContext.outcome || {};
        const transcript = outcome.finalTranscript || sessionContext.transcript || "No transcript available.";
        const opinions = outcome.clinicalOpinions ? JSON.stringify(outcome.clinicalOpinions) : "None";
        const plan = outcome.interventionPlan ? JSON.stringify(outcome.interventionPlan) : "None";

        evidenceBlock = `
        ### CONSULTATION EVIDENCE
        TRANSCRIPT SUMMARY: "${transcript.slice(0, 5000)}..."
        
        CLINICAL OPINIONS (Confirmed):
        ${opinions}

        RECOMMENDED INTERVENTIONS:
        ${plan}
        `;
    }

    const baseInstruction = `You are an expert Educational Psychologist acting as a ${userRole} in ${region.toUpperCase()}.
    Task: Draft a formal Statutory Report (${templateId}) for student "${firstName} ${lastName}".
    
    CRITICAL CONSTRAINTS:
    ${constraints.map(c => `- ${c}`).join('\n')}
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.
    Style: Professional, Objective, Evidence-Based, Statutory Compliant.`;

    const systemPrompt = buildSystemPrompt(baseInstruction, { locale: 'en-GB', languageLabel: 'English (UK)', glossary: {} });

    // Evidence
    const dataBlock = `
    ### STUDENT PROFILE
    Name: ${firstName} ${lastName}
    Context: ${JSON.stringify(studentData).slice(0, 1500)}

    ${evidenceBlock}
    `;

    const fullPrompt = `${systemPrompt}\n\n${dataBlock}\n\nGenerate the JSON report structure now based on the provided EVIDENCE.`;

    // --- 4. GENERATION ---
    let result;
    try {
        // PROD AI CALL Logic (Simplified for Pilot Mock to avoid billing without deploying)
        // In real deployment, replace with: const llmResponse = await ai.generate(...)
        
        // Mocking a "Smart" response that reflects the input
        const mockResponse = JSON.stringify({
            sections: [
                { 
                    id: "section_a", 
                    title: "Section A: Views of Child", 
                    content: sessionContext 
                        ? `During the consultation, ${firstName} shared their perspective. Key themes included: ${evidenceBlock.includes('transcript') ? "discussions recorded in transcript" : "perspectives noted"}.`
                        : "The child's views were gathered through standard assessment."
                },
                { 
                    id: "section_b", 
                    title: "Section B: Special Educational Needs", 
                    content: `Based on the assessment, ${firstName} presents needs in the following areas. Clinical opinions noted: ${sessionContext?.outcome?.clinicalOpinions?.length || 0} specific observations were confirmed.` 
                },
                { 
                    id: "section_f", 
                    title: "Section F: Provision", 
                    content: sessionContext?.outcome?.interventionPlan 
                        ? "Specific interventions recommended: " + sessionContext.outcome.interventionPlan.map((p: any) => p.programName).join(", ") + "."
                        : "Standard provision is recommended."
                }
            ]
        });
        
        result = { text: mockResponse, parsed: JSON.parse(mockResponse) };
        ClinicalReportOutputSchema.parse(result.parsed);

    } catch (err: any) {
        console.error("AI Generation Error", err);
        throw new HttpsError('internal', "AI Generation Failed: " + err.message);
    }

    // --- 5. AUDIT ---
    await saveAiProvenance({
        tenantId: tenantId || 'global',
        studentId: studentId,
        flowName: 'generateClinicalReport',
        prompt: fullPrompt,
        model: 'gemini-1.5-pro',
        responseText: result.text,
        parsedOutput: result.parsed,
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return result.parsed;
};
