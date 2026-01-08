// functions/src/ai/generateClinicalReport.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
// import { applyGlossaryToStructured } from "./utils/glossarySafeApply"; // Unused in Pilot Mock
import { buildSystemPrompt } from "./utils/prompt-builder";
import { getGenkitInstance } from "./utils/model-selector"; 

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();

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
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { 
        tenantId, 
        studentId, 
        templateId, // e.g. 'ehcp_needs_assessment'
        contextPackId // e.g. 'uk_la_pack'
    } = request.data;
    
    const userId = request.auth.uid;
    const startTime = Date.now();
    const userRole = request.auth.token.role || 'EPP';
    const region = request.auth.token.region || 'uk';

    // --- 1. DATA SOVEREIGNTY: Fetch Student Data from SHARD ---
    let studentData: any = {};
    let db = admin.firestore(); 
    
    try {
        const docRef = db.collection('students').doc(studentId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            studentData = docSnap.data();
        } else {
            console.warn(`Student ${studentId} not found in Default DB. Proceeding with mock context for AI generation test.`);
            studentData = { 
                firstName: "Student", 
                lastName: "Unknown", 
                dateOfBirth: "2015-01-01" 
            };
        }
    } catch (e) {
        console.error("DB Read Error", e);
    }

    // --- 2. AI CONFIGURATION ---
    // const ai = await getGenkitInstance('consultationReport'); // Unused in mock flow
    await getGenkitInstance('consultationReport'); // Init check

    // --- 3. CONSTRUCT PROMPT (STATUTORY AWARE) ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const baseInstruction = `You are an expert Educational Psychologist acting as a ${userRole} in ${region.toUpperCase()}.
    Task: Draft a formal Statutory Report (${templateId}) for student "${studentData.firstName} ${studentData.lastName}".
    
    CRITICAL CONSTRAINTS:
    ${constraints.map(c => `- ${c}`).join('\n')}
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.
    Style: Professional, Objective, Evidence-Based, Statutory Compliant.`;

    const systemPrompt = buildSystemPrompt(baseInstruction, { locale: 'en-GB', languageLabel: 'English (UK)', glossary: {} });

    // Mock Evidence for Pilot Generation
    const dataBlock = `
    ### Student Profile
    Name: ${studentData.firstName} ${studentData.lastName}
    DOB: ${studentData.dateOfBirth}
    
    ### Observation Notes
    Student appeared engaged during 1:1 assessment but withdrew during group tasks.
    WISC-V scores suggest strong Verbal Comprehension but low Processing Speed.
    Teacher reports difficulty copying from board.
    `;

    const fullPrompt = `${systemPrompt}\n\n${dataBlock}\n\nGenerate the JSON report structure now.`;

    // --- 4. GENERATION LOOP ---
    // const config = { temperature: 0.1, maxOutputTokens: 4096 }; // Unused in mock

    let result;
    try {
        // Simulating robust response for UI testing
        const mockResponse = JSON.stringify({
            sections: [
                { id: "section_a", title: "Section A: Views of Child", content: "The child expressed that they enjoy art but find math tiring." },
                { id: "section_b", title: "Section B: Special Educational Needs", content: "Analysis indicates significant difficulties with working memory (Low Average range)." },
                { id: "section_f", title: "Section F: Provision", content: "It is recommended that the child receives 15 minutes of daily 1:1 support for literacy." }
            ]
        });
        
        result = { text: mockResponse, parsed: JSON.parse(mockResponse) };
        
        // Validate
        ClinicalReportOutputSchema.parse(result.parsed);

    } catch (err: any) {
        console.error("AI Generation Error", err);
        throw new HttpsError('internal', "AI Generation Failed: " + err.message);
    }

    // --- 5. SAVE DRAFT TO SHARD (VIA AUDIT/PROVENANCE) ---
    await saveAiProvenance({
        tenantId: tenantId || 'global',
        studentId: studentId,
        flowName: 'generateClinicalReport',
        prompt: fullPrompt,
        model: 'gemini-1.5-pro', // Mock
        responseText: result.text,
        parsedOutput: result.parsed,
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return result.parsed;
};
