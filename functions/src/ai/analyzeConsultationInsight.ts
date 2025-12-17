import { CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-pro",
});

interface InsightInput {
    transcriptChunk: string;
    context: string;
}

export const handler = async (request: CallableRequest<InsightInput>) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

    const { transcriptChunk, context: inputContext } = request.data;
    
    const prompt = `Analyze this transcript chunk for immediate risks (self-harm, abuse) or key clinical observations.
    Context: ${inputContext}
    Chunk: "${transcriptChunk}"
    Return JSON: { "type": "risk" | "observation" | "none", "text": "...", "confidence": "high" | "low" }`;

    const { output } = await ai.generate(prompt);
    return JSON.parse(output?.text || "{}");
};
