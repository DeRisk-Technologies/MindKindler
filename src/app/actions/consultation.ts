// src/app/actions/consultation.ts
"use server";

import { ai } from "@/ai/genkit";
import { FEATURE_MODEL_DEFAULTS, FLOW_PARAMS } from "@/ai/config";
import { StudentRecord } from "@/types/schema";

export type ConsultationMode = 'standard' | 'person_centered' | 'complex';

export interface AiInsight {
    id: string;
    type: 'strength' | 'risk' | 'question' | 'diagnosis' | 'observation' | 'safeguarding';
    text: string;
    confidence: number;
}

export interface CopilotContext {
    transcriptSegment: string;
    recentHistory: string[]; 
    studentContext?: Partial<StudentRecord>;
    mode: ConsultationMode;
}

/**
 * Analyzes a single segment of the transcript.
 * Returns an array of insights (Unary Batch).
 */
export async function analyzeSegmentAction(context: CopilotContext): Promise<AiInsight[]> {
    const systemPrompt = buildSystemPrompt(context.mode);
    const userPrompt = buildUserPrompt(context);
    
    try {
        const { text } = await ai.generate({
            model: FEATURE_MODEL_DEFAULTS.consultationInsights,
            system: systemPrompt,
            prompt: userPrompt,
            config: FLOW_PARAMS.consultationInsights, 
        });

        // Parse JSON Lines or Array
        return parseInsights(text);

    } catch (error) {
        console.error("Co-Pilot Action Failed:", error);
        return [];
    }
}

/**
 * Generates a single-shot insight (Non-streaming).
 */
export async function generateLiveInsightAction(transcriptSegment: string, studentContext: Partial<StudentRecord>): Promise<AiInsight[]> {
    const prompt = `
    You are an expert Educational Psychologist Co-Pilot. Analyze this transcript segment. 
    Given the student's history of [Context], identify: 
    1. Potential Safeguarding risks (Red Flag). 
    2. Differential Diagnosis clues. 
    3. Suggested follow-up questions. 
    
    Keep it brief (bullet points).
    Output Format: JSON Array of { type: "risk"|"diagnosis"|"question", text: string, confidence: number }.

    TRANSCRIPT: "${transcriptSegment}"
    CONTEXT: ${JSON.stringify(studentContext)}
    `;

    try {
        const { text } = await ai.generate({ model: FEATURE_MODEL_DEFAULTS.consultationInsights, prompt });
        return parseInsights(text);
    } catch (e) {
        console.error("Single Insight Generation Failed", e);
        return [];
    }
}

/**
 * Post-Session Q&A Logic.
 */
export async function askSessionQuestionAction(question: string, fullTranscript: string, studentContext: Partial<StudentRecord>): Promise<string> {
     const prompt = `
     You are a clinical assistant analyzing a completed consultation session.
     
     STUDENT CONTEXT:
     ${JSON.stringify(studentContext).slice(0, 1000)}...

     TRANSCRIPT:
     ${fullTranscript.slice(0, 20000)}... 

     QUESTION: ${question}

     Answer professionally, citing specific evidence from the transcript where possible.
     `;

     try {
         // Use explicit config to override defaults (often too short for Q&A)
         const { text } = await ai.generate({ 
             model: FEATURE_MODEL_DEFAULTS.consultationInsights, 
             prompt,
             config: {
                 maxOutputTokens: 2048,
                 temperature: 0.4
             }
         });
         return text;
     } catch (e: any) {
         console.error("Q&A Error:", e);
         return `Error analyzing session: ${e.message || "Unknown AI error"}`;
     }
}


// --- Private Helpers ---

function buildSystemPrompt(mode: ConsultationMode): string {
    const base = `You are an expert Educational Psychologist co-pilot assisting in a live consultation.
    Analyze the transcript in real-time. 
    
    Output Format: JSON Array of objects: [{"type": "risk", "text": "...", "confidence": 0.9}, ...]
    Keep text under 15 words.
    `;

    switch (mode) {
        case 'person_centered':
            return base + `
            MODE: Person-Centered.
            - FOCUS: Strengths, aspirations, barriers.
            - DETECT: Emotional cues.
            `;
        case 'complex':
            return base + `
            MODE: Complex Case (Bio-Psycho-Social).
            - FOCUS: Systemic loops, risk factors.
            - SUGGEST: Differential diagnoses hypotheses.
            `;
        case 'standard':
        default:
            return base + `
            MODE: Standard Assessment.
            - FOCUS: Information gaps.
            `;
    }
}

function buildUserPrompt(context: CopilotContext): string {
    let prompt = `RECENT TRANSCRIPT:\n${context.recentHistory.join('\n')}\n\nCURRENT SEGMENT:\n"${context.transcriptSegment}"\n`;

    if (context.studentContext) {
        const { identity, education, health } = context.studentContext;
        prompt += `\nSTUDENT CONTEXT:\n`;
        if (identity) prompt += `- Age: ${calculateAge(identity.dateOfBirth?.value)}\n`;
        if (education?.senStatus) prompt += `- SEN: ${education.senStatus.value}\n`;
        if (health?.conditions) prompt += `- Conditions: ${health.conditions.value.join(', ')}\n`;
    }

    return prompt;
}

function calculateAge(dob?: string): string {
    if (!dob) return "Unknown";
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
}

function parseInsights(raw: string): AiInsight[] {
    const insights: AiInsight[] = [];
    try {
        // Find first '[' and last ']'
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            const json = raw.substring(start, end + 1);
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) {
                parsed.forEach((p: any) => {
                     if (p.type && p.text) {
                        insights.push({
                            id: Date.now().toString() + Math.random().toString().slice(2, 6),
                            type: p.type,
                            text: p.text,
                            confidence: p.confidence || 0.85
                        });
                    }
                });
            }
        } else {
            // Try JSON Lines fallback
            const lines = raw.match(/(\{[\s\S]*?\})/g);
            if (lines) {
                lines.forEach(line => {
                    try {
                        const p = JSON.parse(line);
                        if (p.type && p.text) {
                            insights.push({
                                id: Date.now().toString() + Math.random().toString().slice(2, 6),
                                type: p.type,
                                text: p.text,
                                confidence: p.confidence || 0.85
                            });
                        }
                    } catch (e) {}
                });
            }
        }
    } catch (e) {
        console.warn("Failed to parse LLM insight JSON", e);
    }
    return insights;
}
