import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

// Initialize Genkit
const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-pro",
});

interface GenerateReportInput {
    transcript: string;
    notes: string;
    history: string;
    templateType: string;
}

export const handler = async (request: CallableRequest<GenerateReportInput>) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { transcript, notes, history, templateType } = request.data;

    try {
        const prompt = `
        You are an expert educational psychologist. Write a clinical consultation report in ${templateType} format.
        
        Session Transcript: "${transcript}"
        Clinician Notes: "${notes}"
        Patient History: "${history}"
        
        Output valid JSON with the following structure:
        {
            "title": "Consultation Report",
            "sections": [
                { "title": "Subjective", "content": "..." },
                { "title": "Objective", "content": "..." },
                { "title": "Assessment", "content": "..." },
                { "title": "Plan", "content": "..." }
            ]
        }
        `;

        const { output } = await ai.generate(prompt);
        return JSON.parse(output?.text || "{}");
    } catch (error: any) {
        console.error("AI Error", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
};
