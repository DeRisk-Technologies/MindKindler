import { onCall, HttpsError } from "firebase-functions/v2/https";
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || "mindkindler-84fcf";
const location = "us-central1"; 
const vertexAI = new VertexAI({project: project, location: location});
// UPGRADE: Switched to Gemini 2.5 Flash for better reasoning and speed
const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export const analyzeDocument = onCall(async (request) => {
    // 1. Auth Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { text, fileName } = request.data;

    // 2. Input Validation
    if (!text || !fileName) {
        throw new HttpsError('invalid-argument', 'Missing text or filename.');
    }

    try {
        console.log(`[ClerkAgent] Analyzing ${fileName} for user ${request.auth.uid}`);

        // 3. Construct Prompt
        const prompt = `
        You are "The Clerk", an expert Clinical Administrative Assistant for a UK Educational Psychology practice.
        Your goal is to analyze a raw text document from a Special Educational Needs (SEND) case file and extract structured data.

        Current File Name: "${fileName}"

        Please analyze the text below and output a STRICT JSON object. Do not include markdown formatting (like \`\`\`json).

        Output Schema:
        {
          "extractedStakeholders": [
            { "name": string, "role": "parent" | "senco" | "social_worker" | "pediatrician" | "class_teacher" | "unknown", "email": string | null, "phone": string | null, "confidenceScore": number }
          ],
          "detectedDates": [
            { "label": "dob" | "request_date" | "incident_date" | "assessment_date", "dateIso": "YYYY-MM-DD", "context": string }
          ],
          "suggestedCategory": "parental_advice" | "school_report" | "medical_report" | "social_care_report" | "previous_ehcp" | "hearing_vision" | "speech_language" | "other",
          "confidence": number,
          "riskSignals": string[], // List any mentions of: Safeguarding, Suicide, Self-harm, Tribunal, Exclusion, Abuse, Legal Action
          "summary": string // A concise 2-sentence summary of what this document is.
        }

        Input Text:
        ${text.substring(0, 30000)} // Truncate to safety limit
        `;

        // 4. Call Vertex AI
        const result = await model.generateContent(prompt);
        const candidates = result.response.candidates;
        
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from AI");
        }

        const responseText = candidates[0].content.parts[0].text;
        
        if (!responseText) {
             throw new Error("Empty response text from AI");
        }

        // 5. Parse JSON
        // Robust cleaning of markdown blocks if AI ignored instruction
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        return { success: true, analysis };

    } catch (error: any) {
        console.error("Clerk Agent Error:", error);
        throw new HttpsError('internal', 'AI Analysis Failed', error.message);
    }
});
