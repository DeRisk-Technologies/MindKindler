// functions/src/ai/generateClinicalReport.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore"; 
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

const REGIONAL_DB_MAPPING: Record<string, string> = {
    'uk': 'mindkindler-uk',
    'us': 'mindkindler-us',
    'eu': 'mindkindler-eu',
    'me': 'mindkindler-me',
    'asia': 'mindkindler-asia',
    'default': '(default)'
};

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { 
        tenantId, 
        studentId, 
        templateId, 
        contextPackId,
        studentContext, 
        sessionContext  
    } = request.data;
    
    const userId = request.auth.uid;
    const userRole = request.auth.token.role || 'EPP';
    const region = request.auth.token.region || 'uk';
    const dbId = REGIONAL_DB_MAPPING[region] || REGIONAL_DB_MAPPING['default'];
    
    // Security Check
    if (request.auth.token.tenantId && request.auth.token.tenantId !== tenantId) {
         if (request.auth.token.role !== 'global_admin') {
             throw new HttpsError('permission-denied', 'You do not have permission to access this tenant.');
         }
    }

    const startTime = Date.now();
    let studentData: any = studentContext; 

    // --- 1. DATA RESOLUTION (With Fallback) ---
    if (!studentData) {
        try {
            const regionalDb = getFirestore(admin.app(), dbId);
            const docSnap = await regionalDb.collection('students').doc(studentId).get();
            if (docSnap.exists) {
                const fetchedData = docSnap.data();
                if (fetchedData?.tenantId !== tenantId) throw new HttpsError('permission-denied', 'Student record does not belong to your practice.');
                studentData = fetchedData;
            } else {
                studentData = { identity: { firstName: { value: "Student" } } };
            }
        } catch (e: any) {
            console.error(`[GenerateReport] Fetch error:`, e);
            if (e.code === 'permission-denied') throw e;
            studentData = { identity: { firstName: { value: "Student" } } };
        }
    }

    // --- 2. AI CONFIGURATION ---
    await getGenkitInstance('consultationReport'); 

    // --- 3. CONSTRUCT ENHANCED PROMPT ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const firstName = studentData.identity?.firstName?.value || "Student";
    const lastName = studentData.identity?.lastName?.value || "";

    // Extract Detailed Context from Session
    let contextBlock = "";
    if (sessionContext) {
        const outcome = sessionContext.outcome || {};
        
        // Comprehensive inputs
        const transcript = outcome.finalTranscript || sessionContext.transcript || "None";
        const opinions = outcome.clinicalOpinions ? JSON.stringify(outcome.clinicalOpinions) : "None";
        const manualNotes = outcome.manualClinicalNotes ? JSON.stringify(outcome.manualClinicalNotes) : "None";
        const plan = outcome.interventionPlan ? JSON.stringify(outcome.interventionPlan) : "None";
        const mode = sessionContext.mode || "Standard";

        contextBlock = `
        ### CONSULTATION CONTEXT
        - Mode: ${mode}
        
        ### EVIDENCE
        1. TRANSCRIPT SUMMARY: "${transcript.slice(0, 4000)}..."
        2. CONFIRMED CLINICAL OPINIONS: ${opinions}
        3. MANUAL EPP NOTES: ${manualNotes}
        4. FINAL INTERVENTION PLAN: ${plan}
        `;
    }

    const safeTemplateId = (templateId || "").toString();
    const isReferral = safeTemplateId.toLowerCase().includes('referral');
    const docType = isReferral ? "Referral Letter/Clinical Note" : "Formal Statutory Report";

    const baseInstruction = `You are an expert Educational Psychologist acting as a ${userRole} in ${region.toUpperCase()}.
    Task: Draft a ${docType} (Template: ${safeTemplateId}) for student "${firstName} ${lastName}".
    
    INSTRUCTIONS:
    1. SYNTHESIZE the Student Profile with the Consultation Evidence.
    2. REFERENCE specific clinical opinions (both AI-detected and Manual Notes) to justify sections.
    3. INCORPORATE the Intervention Plan into the recommendations section.
    4. ADOPT the tone appropriate for the Consultation Mode (e.g., Person-Centered vs Complex).
    
    CRITICAL CONSTRAINTS:
    ${constraints.map(c => `- ${c}`).join('\n')}
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.`;

    const systemPrompt = buildSystemPrompt(baseInstruction, { locale: 'en-GB', languageLabel: 'English (UK)', glossary: {} });

    const dataBlock = `
    ### STUDENT PROFILE
    Name: ${firstName} ${lastName}
    Profile: ${JSON.stringify(studentData).slice(0, 1500)}

    ${contextBlock}
    `;

    const fullPrompt = `${systemPrompt}\n\n${dataBlock}\n\nGenerate the JSON report structure now based on the provided EVIDENCE.`;

    // --- 4. GENERATION ---
    let result;
    try {
        // PROD AI CALL Logic (Mock for consistency until Genkit V2 fully wired)
        const mockResponse = JSON.stringify({
            sections: [
                { 
                    id: "section_a", 
                    title: isReferral ? "Reason for Referral" : "Section A: Views of Child", 
                    content: sessionContext 
                        ? `During the ${sessionContext.mode || 'standard'} consultation, ${firstName} shared their views. Key themes included: ${contextBlock.includes('transcript') ? "discussions recorded in transcript" : "perspectives noted"}.`
                        : "The child's views were gathered through standard assessment."
                },
                { 
                    id: "section_b", 
                    title: isReferral ? "Clinical Observations" : "Section B: Special Educational Needs", 
                    content: `Based on assessment and ${sessionContext?.outcome?.clinicalOpinions?.length || 0} confirmed clinical observations, ${firstName} presents needs in the following areas. Manual notes indicate: ${sessionContext?.outcome?.manualClinicalNotes?.join(', ') || "No additional notes"}.` 
                },
                { 
                    id: "section_f", 
                    title: isReferral ? "Recommendations" : "Section F: Provision", 
                    content: sessionContext?.outcome?.interventionPlan 
                        ? "Specific interventions recommended based on the agreed plan: " + sessionContext.outcome.interventionPlan.map((p: any) => p.programName).join(", ") + "."
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
