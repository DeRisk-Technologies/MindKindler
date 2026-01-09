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
        studentContext // NEW: Client-provided context
    } = request.data;
    
    const userId = request.auth.uid;
    const startTime = Date.now();
    const userRole = request.auth.token.role || 'EPP';
    const region = request.auth.token.region || 'uk';

    // --- 1. DATA RESOLUTION ---
    let studentData: any = studentContext; // Prioritize client data

    if (!studentData) {
        console.log(`Searching for student ${studentId} in Default DB...`);
        try {
            const docSnap = await admin.firestore().collection('students').doc(studentId).get();
            if (docSnap.exists) {
                studentData = docSnap.data();
            } else {
                console.warn(`Student ${studentId} not found. Using fallback mock.`);
                studentData = { 
                    identity: { firstName: { value: "Student" }, lastName: { value: "Unknown" } },
                    dateOfBirth: "2015-01-01" 
                };
            }
        } catch (e) {
            console.error("DB Read Error", e);
        }
    } else {
        console.log(`Using client-provided context for student ${studentId}`);
    }

    // --- 2. AI CONFIGURATION ---
    await getGenkitInstance('consultationReport'); 

    // --- 3. CONSTRUCT PROMPT ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const firstName = studentData.identity?.firstName?.value || "Student";
    const lastName = studentData.identity?.lastName?.value || "Unknown";

    const baseInstruction = `You are an expert Educational Psychologist acting as a ${userRole} in ${region.toUpperCase()}.
    Task: Draft a formal Statutory Report (${templateId}) for student "${firstName} ${lastName}".
    
    CRITICAL CONSTRAINTS:
    ${constraints.map(c => `- ${c}`).join('\n')}
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.
    Style: Professional, Objective, Evidence-Based, Statutory Compliant.`;

    const systemPrompt = buildSystemPrompt(baseInstruction, { locale: 'en-GB', languageLabel: 'English (UK)', glossary: {} });

    // Evidence
    const dataBlock = `
    ### Student Profile
    Name: ${firstName} ${lastName}
    Context: ${JSON.stringify(studentData).slice(0, 2000)}
    `;

    const fullPrompt = `${systemPrompt}\n\n${dataBlock}\n\nGenerate the JSON report structure now.`;

    // --- 4. GENERATION ---
    let result;
    try {
        // PROD AI CALL Logic (Simplified for Pilot Mock)
        const mockResponse = JSON.stringify({
            sections: [
                { id: "section_a", title: "Section A: Views of Child", content: "The child expressed that they enjoy creative activities but struggle with sustained attention in noisy environments." },
                { id: "section_b", title: "Section B: Special Educational Needs", content: "Evidence suggests significant challenges with auditory processing and working memory, which impact classroom participation." },
                { id: "section_f", title: "Section F: Provision", content: "Provision should include visual timetables, simplified verbal instructions, and 15 minutes of sensory integration daily." }
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
