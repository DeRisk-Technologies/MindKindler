// functions/src/ai/generateClinicalReport.ts

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore"; 
import { saveAiProvenance } from "./utils/provenance";
import { z } from "zod";
import { buildSystemPrompt } from "./utils/prompt-builder";
import { VertexAI } from '@google-cloud/vertexai';
import { logAuditEvent } from "../services/audit";
import { formatConsultationHistory } from "./utils/consultation-formatter";
import { checkAndIncrementUsage } from "../billing/usage"; // IMPORTED

if (!admin.apps.length) admin.initializeApp();

// ... (Rest of imports and configs)
const project = process.env.GCLOUD_PROJECT || 'mindkindler-84fcf';
const location = 'europe-west3';
const vertex_ai = new VertexAI({ project: project, location: location });

const generativeModel = vertex_ai.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: "application/json" } 
});

// ... (Schemas)
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
    
    // --- STEP 1: BILLING & USAGE CHECK ---
    // This must happen before ANY expensive AI call.
    try {
        await checkAndIncrementUsage(tenantId, 'report_generation');
    } catch (e: any) {
        console.warn(`[Billing] Usage limit exceeded for tenant ${tenantId}`);
        throw new HttpsError('resource-exhausted', e.message);
    }
    
    const userId = request.auth.uid;
    const userRole = request.auth.token.role || 'EPP';
    const region = request.auth.token.region || 'uk';
    const dbId = REGIONAL_DB_MAPPING[region] || REGIONAL_DB_MAPPING['default'];
    
    console.log(`[GenerateReport] Starting for Tenant: ${tenantId}, Student: ${studentId}, Region: ${region}, DB: ${dbId}, Model: gemini-2.5-flash`);

    // ... (Rest of the function remains identical)
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
        console.warn(`[GenerateReport] Failed to get named DB ${dbId}, falling back to default.`);
        regionalDb = admin.firestore(); 
    }

    // --- 1. FETCH DATA (Student & Consultations) ---
    let formattedEvidence = "No consultation history available.";
    
    try {
        if (!studentData) {
            console.log(`[GenerateReport] Fetching student data from ${dbId}...`);
            const docSnap = await regionalDb.collection('students').doc(studentId).get();
            if (docSnap.exists) {
                studentData = docSnap.data();
            } else {
                studentData = { identity: { firstName: { value: "Student" } } };
            }
        }

        // FETCH CONSULTATION HISTORY
        console.log(`[GenerateReport] Fetching consultation_sessions for student ${studentId}...`);
        const consultsSnap = await regionalDb.collection('consultation_sessions')
            .where('studentId', '==', studentId)
            .orderBy('createdAt', 'desc') // Ensure latest first
            .limit(3) // Increased from 1 to 3 to get more context
            .get();

        const consultationData = consultsSnap.docs.map(doc => doc.data());
        console.log(`[GenerateReport] Found ${consultationData.length} sessions.`);
        
        if (consultationData.length > 0) {
            formattedEvidence = formatConsultationHistory(consultationData);
        } else if (sessionContext) {
            formattedEvidence = formatConsultationHistory([sessionContext]);
        }

    } catch (e: any) {
        console.error(`[GenerateReport] Data Fetch Error:`, e);
    }

    // --- 2. FETCH SCHOOL/PARENT FORMS & ASSESSMENTS (Assessment Results) ---
    let schoolViews = "";
    let parentViews = "";
    let assessmentData = "";

    try {
        const contribSnap = await regionalDb.collection('assessment_results')
            .where('studentId', '==', studentId)
            .limit(10) 
            .get();

        contribSnap.forEach(doc => {
            const data = doc.data();
            const template = data.templateId || data.type; 
            
            // Format Content: If responses is object, jsonify it.
            let content = "";
            if (data.responses) {
                 content = JSON.stringify(data.responses);
            } else if (data.totalScore) {
                 content = `Score: ${data.totalScore}`;
                 if(data.category) content += ` (Category: ${data.category})`;
            }

            if (['uk_school_contribution', 'nhs_neuro_questionnaire'].includes(template)) {
                schoolViews += `\n[Form: ${template}]: ${content}`;
            } else if (['uk_one_page_profile'].includes(template)) {
                parentViews += `\n[Form: ${template}]: ${content}`;
            } else {
                // General Assessments (WISC-V, etc.)
                assessmentData += `\n[Assessment: ${template}]: ${content}`;
            }
        });
    } catch (e) {
        console.warn("[GenerateReport] Failed to fetch forms:", e);
    }

    // --- 3. CONSTRUCT PROMPT ---
    const constraints = contextPackId === 'uk_la_pack' 
        ? ["No Medical Diagnosis (Statutory)", "Use Tentative Language (appears, seems)", "Evidence-Based Claims Only"]
        : [];

    const firstName = studentData?.identity?.firstName?.value || "Student";
    const lastName = studentData?.identity?.lastName?.value || "";
    const safeTemplateId = (templateId || "generic_report").toString();
    const isReferral = safeTemplateId.toLowerCase().includes('referral');
    const docType = isReferral ? "Referral Letter" : "Statutory Report";

    const baseInstruction = `You are an expert Educational Psychologist acting as a ${userRole} in the UK.
    Task: Write a professional ${docType} for ${firstName} ${lastName}.
    
    ### EVIDENCE SOURCE 1: CONSULTATION TRANSCRIPTS & INSIGHTS
    ${formattedEvidence}

    ### EVIDENCE SOURCE 2: SCHOOL & PARENT VIEWS
    School Views: ${schoolViews || "No formal school contribution forms found."}
    Parent Views: ${parentViews || "No formal parent forms found."}

    ### EVIDENCE SOURCE 3: CLINICAL ASSESSMENTS & DATA
    ${assessmentData || "No standardized assessments recorded."}

    ### INSTRUCTIONS:
    1. **Format**: Use professional HTML formatting. 
       - Use <ul><li> for lists.
       - Use <p> for paragraphs.
       - Do NOT use Markdown (no **bold**, no # headings). Use <strong> and <h3> tags inside the content string if needed, but the JSON structure handles main section titles.
    
    2. **Section A (Views)**: 
       - Quote the "STUDENT VOICE" from consultations directly.
       - If School/Parent views are missing, explicitly state: "Formal views from school/parents were not available at the time of drafting, however, themes from the consultation indicate..." and synthesize indirect views if available in the transcript.
    
    3. **Section B (Needs)**: 
       - Use the "THEMES" (Clinical Insights) to identify needs.
       - Integrate WISC-V or other assessment scores if present in Source 3.
    
    4. **Section F (Provision)**: 
       - Use "AGREED INTERVENTIONS" to populate recommendations.
       - Be specific and quantifiable (e.g. "Weekly sessions of 30 mins").

    5. **RISK**: If student mentioned self-harm (see quotes), flag it immediately in a dedicated section or heavily emphasized note.

    Constraints: ${constraints.join(', ')}
    
    Output JSON Schema:
    {
      "sections": [
        { "id": "section_a", "title": "Section A: Student & Family Views", "content": "HTML string..." },
        { "id": "section_b", "title": "Section B: Special Educational Needs", "content": "HTML string..." },
        { "id": "section_f", "title": "Section F: Recommended Provision", "content": "HTML string..." }
        ... more sections as appropriate for the template ...
      ]
    }`;

    const systemPrompt = buildSystemPrompt(baseInstruction, { 
        locale: 'en-GB', 
        languageLabel: 'English (UK)', 
        reportType: isReferral ? 'referral' : 'statutory' 
    });

    const fullPrompt = `${systemPrompt}\n\nSTUDENT BIO: ${JSON.stringify(studentData?.identity)}`;
    console.log(`[GenerateReport] Prompt prepared. Length: ${fullPrompt.length}`);

    // --- 4. GENERATION (REAL AI) ---
    let result;
    try {
        console.log(`[GenerateReport] Calling Vertex AI (gemini-2.5-flash)...`);
        const response = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
        });
        
        const candidate = response.response.candidates?.[0];
        let text = candidate?.content?.parts?.[0]?.text || "";
        
        // Sanitize JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        console.log(`[GenerateReport] AI Response received. Length: ${text.length}`);
        
        let parsed;
        try {
            parsed = JSON.parse(text);
            // Schema check
            ClinicalReportOutputSchema.parse(parsed);
        } catch (e) {
            console.warn("JSON Parse or Schema Validation Failed, falling back to raw text.", e);
            parsed = { sections: [{ id: "raw", title: "Draft", content: text }] };
        }
        
        result = { text, parsed };

        await logAuditEvent({
            tenantId,
            action: 'GENERATE_REPORT',
            actorId: userId,
            resourceType: 'student', 
            resourceId: studentId,
            metadata: { 
                templateId: safeTemplateId, 
                docType: docType
            }
        });

    } catch (err: any) {
        console.error("AI Generation Error", err);
        throw new HttpsError('internal', "AI Generation Failed: " + err.message);
    }

    try {
        await saveAiProvenance({
            tenantId: tenantId || 'global',
            studentId: studentId,
            flowName: 'generateClinicalReport',
            prompt: fullPrompt,
            model: 'gemini-2.5-flash',
            responseText: result.text,
            parsedOutput: result.parsed,
            latencyMs: Date.now() - startTime,
            createdBy: userId
        });
    } catch (e) {
        console.warn("Provenance Save Failed", e);
    }

    return result.parsed;
};
