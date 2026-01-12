// functions/src/ai/flows/recommendAssessments.ts

import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { retrieveContext } from "../knowledge/retrieve";
import { z } from "zod";

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-2.5-pro",
});

const RecommendationSchema = z.object({
    gaps: z.array(z.string()), // Evidence gaps
    recommendations: z.array(z.object({
        templateId: z.string(),
        title: z.string(),
        reasoning: z.string(),
        confidence: z.enum(['high', 'medium', 'low'])
    }))
});

export async function recommendAssessmentsFlow(
    tenantId: string,
    transcript: string,
    notes: string
) {
    // 1. RAG: Search for available assessment templates in knowledge base
    // In a real app, we'd index templates. For now, we search general knowledge for assessment types.
    const relevantDocs = await retrieveContext(tenantId, "psychological assessment templates", 5);
    const context = relevantDocs.map(d => d.text).join('\n');

    const prompt = `
    Analyze this consultation context:
    Transcript: "${transcript.substring(0, 5000)}"
    Notes: "${notes}"

    Available Templates/Knowledge:
    ${context}

    Task:
    1. Identify gaps in current evidence (e.g. lack of cognitive scores).
    2. Recommend assessments to fill gaps.
    
    Output JSON: { gaps: string[], recommendations: [{ templateId, title, reasoning, confidence }] }
    `;

    const { output } = await ai.generate({ prompt });
    const cleanJson = output?.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    
    try {
        const parsed = JSON.parse(cleanJson);
        return RecommendationSchema.parse(parsed);
    } catch (e) {
        return { gaps: [], recommendations: [] };
    }
}
