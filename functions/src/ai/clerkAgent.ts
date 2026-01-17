import { onCall, HttpsError } from "firebase-functions/v2/https";
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || "mindkindler-84fcf";
const location = "us-central1"; 
const vertexAI = new VertexAI({project: project, location: location});

// UPGRADE: Use JSON Mode configuration
const model = vertexAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-001",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1 // Lower temp for deterministic output
    }
});

export const analyzeDocument = onCall({ region: "europe-west3" }, async (request) => {
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
          "riskSignals": string[], 
          "summary": string 
        }

        Input Text:
        ${text.substring(0, 30000)}
        `;

        // 4. Call Vertex AI
        const result = await model.generateContent(prompt);
        const candidates = result.response.candidates;
        
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from AI");
        }

        let responseText = candidates[0].content.parts[0].text || "{}";
        
        // 5. Robust Parsing
        // Even with JSON mode, sometimes it wraps in ```json
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find first '{' and last '}' to strip any conversational prefix/suffix
        const firstOpen = responseText.indexOf('{');
        const lastClose = responseText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            responseText = responseText.substring(firstOpen, lastClose + 1);
        }

        let analysis;
        try {
            analysis = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parse Error. Raw Text:", responseText);
            throw new Error("AI returned invalid JSON format.");
        }

        return { success: true, analysis };

    } catch (error: any) {
        console.error("Clerk Agent Error:", error);
        throw new HttpsError('internal', 'AI Analysis Failed', error.message);
    }
});
