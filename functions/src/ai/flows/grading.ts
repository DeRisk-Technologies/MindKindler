// functions/src/ai/flows/grading.ts

import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { saveAiProvenance } from "../utils/provenance";
import { z } from "zod";

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-1.5-flash", 
});

// Output Schema
const GradingOutputSchema = z.object({
    score: z.number(),
    reasoning: z.string(),
    feedback: z.string(),
    confidence: z.enum(['high', 'medium', 'low'])
});

export async function scoreOpenTextResponseFlow(
    tenantId: string,
    question: string,
    studentAnswer: string,
    rubric: string | null,
    maxPoints: number,
    userId: string
) {
    const startTime = Date.now();

    // 1. Construct Prompt
    const prompt = `
    You are an automated grading assistant for an educational platform.
    Task: Grade the student's answer based on the provided question and rubric.
    
    Question: "${question}"
    Max Points: ${maxPoints}
    Rubric: ${rubric || "Award points for correctness, clarity, and depth. Deduct for factual errors."}
    
    Student Answer:
    "${studentAnswer}"
    
    Instructions:
    - Assign a score between 0 and ${maxPoints}.
    - Provide reasoning for the score.
    - Provide constructive feedback for the student.
    - Assess your confidence (high/medium/low) based on ambiguity.
    
    Output: JSON matching { score: number, reasoning: string, feedback: string, confidence: string }.
    `;

    // 2. Generate
    const { output } = await ai.generate({ 
        prompt, 
        config: { temperature: 0.0 } // Deterministic grading
    });

    const rawText = output?.text || "{}";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
        parsed = JSON.parse(cleanJson);
        // Ensure score is within bounds
        parsed.score = Math.min(Math.max(0, parsed.score), maxPoints);
        GradingOutputSchema.parse(parsed);
    } catch (e: any) {
        console.warn("Grading Parsing Failed", e.message);
        // Fallback
        parsed = { 
            score: 0, 
            reasoning: "AI grading failed to parse. Manual review recommended.", 
            feedback: "Please contact instructor.",
            confidence: 'low' 
        };
    }

    // 3. Provenance
    await saveAiProvenance({
        tenantId,
        studentId: 'system', // grading is often done in batch, linking to specific student ID happens at call site if needed
        flowName: 'gradeOpenText',
        prompt,
        model: 'googleai/gemini-1.5-flash',
        responseText: rawText,
        parsedOutput: parsed,
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return parsed;
}
