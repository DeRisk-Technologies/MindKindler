import { onCall, HttpsError } from "firebase-functions/v2/https";
import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GCLOUD_PROJECT || "mindkindler-84fcf";
const location = "us-central1"; 
const vertexAI = new VertexAI({project: project, location: location});
// UPGRADE: Switched to Gemini 2.0 Flash
const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export const extractFindings = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    
    const { evidenceText } = request.data;

    const prompt = `
    You are a Clinical Data Analyst for UK Special Education.
    Your task is to analyze clinical reports and extract "Findings" (distinct assertions about a child's needs).

    Input Text: "${evidenceText.substring(0, 30000)}..."

    Output Format (STRICT JSON Array):
    [
      {
        "category": "communication_interaction" | "cognition_learning" | "semh" | "sensory_physical" | "independence_self_care",
        "text": "The assertion text (e.g. 'Mother reports sleep disturbance')",
        "topics": ["keyword1", "keyword2"] (e.g. ['sleep', 'anxiety'])
      }
    ]
    `;

    try {
        const result = await model.generateContent(prompt);
        const candidates = result.response.candidates;
        
        if (!candidates || candidates.length === 0) throw new Error("No AI response candidates");
        const text = candidates[0].content.parts[0].text;
        
        if (!text) throw new Error("AI response text is empty");

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return { findings: JSON.parse(cleanJson) };
    } catch (error: any) {
        throw new HttpsError('internal', 'Triangulation Failed', error.message);
    }
});

export const draftProvisionPlan = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    
    const { findings, category } = request.data;

    const prompt = `
    You are a UK SEN Legal Expert drafting Section F of an EHCP.
    Based on the following Needs (Findings) in the area of "${category}", generate Specific & Quantified provisions.

    Needs:
    ${findings.map((f: any) => `- ${f.text}`).join('\n')}

    Output Format (STRICT JSON Array):
    [
      {
        "outcome": "By the end of KS2, the child will...",
        "provision": "1:1 intervention using the 'Toe by Toe' phonics scheme",
        "frequency": "3x 20 mins per week",
        "staffing": "Trained Teaching Assistant (TA)"
      }
    ]
    `;

    try {
        const result = await model.generateContent(prompt);
        const candidates = result.response.candidates;
        
        if (!candidates || candidates.length === 0) throw new Error("No AI response candidates");
        const text = candidates[0].content.parts[0].text;
        
        if (!text) throw new Error("AI response text is empty");

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return { provision: JSON.parse(cleanJson) };
    } catch (error: any) {
        throw new HttpsError('internal', 'Provision Drafting Failed', error.message);
    }
});
