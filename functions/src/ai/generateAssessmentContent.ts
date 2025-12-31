import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-pro",
});

interface GenerateAssessmentInput {
    topic: string;
    count: number;
    difficulty: string;
}

export const handler = async (request: CallableRequest<GenerateAssessmentInput>) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

    const { topic, count, difficulty } = request.data;

    try {
        const prompt = `Create ${count} ${difficulty} level multiple-choice questions about "${topic}" for a student assessment.
        Return JSON array of objects: { text, options: [], correctAnswer, points: 1 }`;

        const { output } = await ai.generate(prompt);
        return { questions: JSON.parse(output?.text || "[]") };
    } catch (error) {
         throw new functions.https.HttpsError('internal', 'AI Generation Failed');
    }
};
