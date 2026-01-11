// functions/src/ai/generateClinicalReport.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore"; 
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { buildSystemPrompt } from "./utils/prompt-builder";
import { getGenkitInstance } from "./utils/model-selector"; 
import { logAuditEvent } from "../services/audit"; // Phase 34: Audit Integration

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
    let regionalDb: FirebaseFirestore.Firestore;

    try {
        regionalDb = getFirestore(admin.app(), dbId);
    } catch (e) {
        regionalDb = admin.firestore(); // Fallback
    }

    // --- 1. DATA RESOLUTION (With Fallback) ---
    if (!studentData) {
        try {
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

    // --- 1.5 FETCH CONTRIBUTIONS (Phase 33: Multi-Source Intelligence) ---
    let schoolViews = "";
    let parentViews = "";

    try {
        // Fetch assessments/forms linked to this student
        const contribSnap = await regionalDb.collection('assessment_results')
            .where('studentId', '==', studentId)
            // .where('status', '==', 'completed') // Optional: only finalized forms
            .limit(20) 
            .get();

        contribSnap.forEach(doc => {
            const data = doc.data();
            const responses = data.responses; 
            const template = data.templateId; // e.g. 'uk_school_contribution'

            // Convert responses to AI-readable string
            let content = "";
            if (Array.isArray(responses)) {
                content = responses.map(r => `${r.questionId}: ${r.answer}`).join(', ');
            } else {
                content = JSON.stringify(responses);
            }

            if (['uk_school_contribution', 'nhs_neuro_questionnaire'].includes(template)) {
                schoolViews += `\n[Form: ${template}]: ${content}`;
            } else if (['uk_one_page_profile'].includes(template)) {
                parentViews += `\n[Form: ${template}]: ${content}`;
            }
        });
    } catch (e) {
        console.warn("[GenerateReport] Failed to fetch contributions:", e);
    }

    // --- 2. AI CONFIGURATION ---
    await getGenkitInstance('consultationReport'); 

    // --- 3. CONSTRUCT ENHANCED PROMPT ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const firstName = studentData.identity?.firstName?.value || "Student";
    const lastName = studentData.identity?.lastName?.value || "";

    // Extract Detailed Context
    let contextBlock = `
    ### MULTI-SOURCE INTELLIGENCE (Phase 33)
    
    SCHOOL DATA (Teacher Views / SENCO Forms):
    ${schoolViews || "No school forms submitted."}

    PARENT DATA (Home Views / One Page Profile):
    ${parentViews || "No parent forms submitted."}
    `;

    if (sessionContext) {
        const outcome = sessionContext.outcome || {};
        
        const transcript = outcome.finalTranscript || sessionContext.transcript || "None";
        const opinions = outcome.clinicalOpinions ? JSON.stringify(outcome.clinicalOpinions) : "None";
        const manualNotes = outcome.manualClinicalNotes ? JSON.stringify(outcome.manualClinicalNotes) : "None";
        const plan = outcome.interventionPlan ? JSON.stringify(outcome.interventionPlan) : "None";
        const mode = sessionContext.mode || "Standard";

        contextBlock += `
        ### CONSULTATION CONTEXT
        - Mode: ${mode}
        
        ### SESSION EVIDENCE
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
    1. SYNTHESIZE the Student Profile with the Multi-Source Intelligence and Consultation Evidence.
    2. TRIANGULATE findings: Does the School Data match the Parent Data? Does the Transcript support the Forms?
    3. REFERENCE specific sources (e.g. "Teacher reports that...", "During consultation...").
    4. INCORPORATE the Intervention Plan into the recommendations section.
    
    CRITICAL CONSTRAINTS:
    ${constraints.map(c => `- ${c}`).join('\n')}
    
    Output Format: strictly valid JSON matching { sections: [{ id, title, content }] }.`;

    // Pass reportType context to prompt builder
    const systemPrompt = buildSystemPrompt(baseInstruction, { 
        locale: 'en-GB', 
        languageLabel: 'English (UK)', 
        glossary: {},
        reportType: isReferral ? 'referral' : 'statutory' 
    });

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
                    title: isReferral ? "Reason for Referral" : "Section A: Views of Child & Parent", 
                    content: parentViews 
                        ? `Parental views were captured via the One Page Profile. Key themes include: ${parentViews.slice(0, 100)}... Additionally, during consultation, ${firstName} expressed...`
                        : `During the ${sessionContext?.mode || 'standard'} consultation, ${firstName} shared their views.`
                },
                { 
                    id: "section_b", 
                    title: isReferral ? "Clinical Observations" : "Section B: Special Educational Needs", 
                    content: `Triangulating data from school forms and clinical observation: \n\nSchool Report: ${schoolViews ? "Indicates specific needs in attainment." : "Pending."} \n\nClinical Opinion: Based on assessment, ${firstName} presents needs in the following areas.` 
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

        // --- PHASE 34: AUDIT LOG ---
        await logAuditEvent({
            tenantId,
            action: 'GENERATE_REPORT',
            actorId: userId,
            resourceType: 'student', // Log against student as report ID isn't persisted yet
            resourceId: studentId,
            metadata: { templateId, docType }
        });

    } catch (err: any) {
        console.error("AI Generation Error", err);
        throw new HttpsError('internal', "AI Generation Failed: " + err.message);
    }

    // --- 5. AI PROVENANCE (Technical Audit) ---
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
