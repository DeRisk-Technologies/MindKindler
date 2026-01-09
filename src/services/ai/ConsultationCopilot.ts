// src/services/ai/ConsultationCopilot.ts

import { ai } from "@/ai/genkit"; 
import { StudentRecord } from "@/types/schema";
import { FEATURE_MODEL_DEFAULTS, FLOW_PARAMS } from "@/ai/config";
import { generateContent } from "@/ai/config"; // Fallback/Standard generation

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
 * The Consultation Co-Pilot Engine (Gemini 2.0 Flash)
 * Analyzes live transcript segments and generates immediate clinical insights via Streaming.
 */
export class ConsultationCopilot {
    
    /**
     * Analyzes a single segment of the transcript using True Streaming.
     * Insights are yielded as soon as they are fully formed by the AI.
     */
    async *analyzeSegment(context: CopilotContext): AsyncGenerator<AiInsight> {
        
        const systemPrompt = this.buildSystemPrompt(context.mode);
        const userPrompt = this.buildUserPrompt(context);
        
        try {
            // 1. Initialize Streaming Request
            const { stream } = await ai.generateStream({
                model: FEATURE_MODEL_DEFAULTS.consultationInsights,
                system: systemPrompt,
                prompt: userPrompt,
                config: FLOW_PARAMS.consultationInsights, 
            });

            // 2. Stream & Buffer Logic
            let buffer = "";
            
            for await (const chunk of stream) {
                const chunkText = chunk.text();
                buffer += chunkText;

                // 3. Attempt to extract complete JSON objects from the growing buffer
                // We look for objects enclosed in braces { ... }
                // This regex finds the first occurrence of a potential JSON object
                let match;
                // eslint-disable-next-line no-cond-assign
                while ((match = buffer.match(/(\{[\s\S]*?\})/))) { 
                    const rawJson = match[0];
                    
                    try {
                        const parsed = JSON.parse(rawJson);
                        
                        // Validate format
                        if (parsed.type && parsed.text) {
                            yield {
                                id: Date.now().toString() + Math.random().toString().slice(2, 6),
                                type: parsed.type,
                                text: parsed.text,
                                confidence: parsed.confidence || 0.85
                            };
                        }

                        // Remove the processed object from the buffer to avoid re-reading
                        buffer = buffer.replace(rawJson, "").trim(); 

                    } catch (e) {
                        // If parsing fails, it might be incomplete (e.g. nested braces). 
                        // We break the loop and wait for more chunks to complete the JSON structure.
                        break; 
                    }
                }
            }

        } catch (error) {
            console.error("Co-Pilot Streaming Failed:", error);
        }
    }

    /**
     * Legacy/Unified Helper: Generates a single-shot insight (Non-streaming).
     * Useful for post-processing or specific point-in-time checks.
     */
    async generateLiveInsight(transcriptSegment: string, studentContext: Partial<StudentRecord>): Promise<AiInsight[]> {
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
            const result = await generateContent(prompt);
            const text = result.text || "[]";
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (e) {
            console.error("Single Insight Generation Failed", e);
            return [];
        }
    }

    /**
     * Post-Session Q&A Logic.
     * Allows the EPP to ask questions about the entire session transcript.
     */
    async askSessionQuestion(question: string, fullTranscript: string, studentContext: Partial<StudentRecord>): Promise<string> {
         const prompt = `
         You are a clinical assistant analyzing a completed consultation session.
         
         STUDENT CONTEXT:
         ${JSON.stringify(studentContext).slice(0, 1000)}...

         TRANSCRIPT:
         ${fullTranscript.slice(0, 10000)}...

         QUESTION: ${question}

         Answer professionally, citing specific evidence from the transcript where possible.
         `;

         try {
             const result = await generateContent(prompt);
             return result.text || "I could not generate an answer.";
         } catch (e) {
             return "Error analyzing session data.";
         }
    }

    private buildSystemPrompt(mode: ConsultationMode): string {
        const base = `You are an expert Educational Psychologist co-pilot assisting in a live consultation.
        Analyze the transcript in real-time. 
        
        CRITICAL: Output distinct JSON objects one after another. Do NOT wrap them in a list [].
        Example Stream:
        {"type": "risk", "text": "Sleep issue detected", "confidence": 0.9}
        {"type": "question", "text": "Ask about frequency", "confidence": 0.8}
        
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

    private buildUserPrompt(context: CopilotContext): string {
        let prompt = `RECENT TRANSCRIPT:\n${context.recentHistory.join('\n')}\n\nCURRENT SEGMENT:\n"${context.transcriptSegment}"\n`;

        if (context.studentContext) {
            const { identity, education, health } = context.studentContext;
            prompt += `\nSTUDENT CONTEXT:\n`;
            if (identity) prompt += `- Age: ${this.calculateAge(identity.dateOfBirth?.value)}\n`;
            if (education?.senStatus) prompt += `- SEN: ${education.senStatus.value}\n`;
            if (health?.conditions) prompt += `- Conditions: ${health.conditions.value.join(', ')}\n`;
        }

        return prompt;
    }

    private calculateAge(dob?: string): string {
        if (!dob) return "Unknown";
        const ageDifMs = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    }
}

// Export singleton
export const consultationCopilot = new ConsultationCopilot();
