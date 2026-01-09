'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { chunkTranscript, normalizeSpeakerTags } from '@/ai/utils/transcript';
import { applyGlossaryToStructured } from '@/ai/utils/glossarySafeApply';

export async function generateConsultationInsights(input: any) {
    
    const ConsultationInsightsOutputSchema = z.object({
      insights: z.array(z.object({
        type: z.enum(['diagnosis', 'treatment', 'risk', 'observation']),
        text: z.string(),
        confidence: z.enum(['low', 'medium', 'high']),
        rationale: z.string().optional(),
        sources: z.array(z.object({
            chunkIndex: z.number(),
            snippet: z.string().optional()
        })).optional()
      })),
    });

    let chunks = [];
    
    if (input.fullTranscript) {
        const normalized = normalizeSpeakerTags(input.fullTranscript);
        chunks = chunkTranscript(normalized);
    } else if (input.transcriptChunk) {
        chunks = [{ text: input.transcriptChunk, chunkIndex: 0, totalChunks: 1, startIndex: 0, endIndex: input.transcriptChunk.length }];
    } else {
        return { insights: [] };
    }

    const allInsights: any[] = [];

    const promises = chunks.map(async (chunk) => {
        const promptText = composeConsultationPrompt({
            baseInstruction: `You are a real-time AI Co-Pilot for an educational psychologist. Analyze the following transcript chunk (${chunk.chunkIndex + 1}/${chunk.totalChunks}) for a student (Age: ${input.studentAge || 'Unknown'}).
            Task: Identify any potential differential diagnoses, treatment ideas, risk factors (e.g. self-harm, abuse), or key observations.
            Output a list of concise insights.`,
            transcript: chunk.text,
            notes: input.currentNotes,
            locale: input.locale,
            languageLabel: input.languageLabel,
            glossary: input.glossary,
            evidence: input.evidence as EvidenceItem[],
        });

        const { output } = await ai.generate({
            prompt: promptText,
            output: { schema: ConsultationInsightsOutputSchema },
            config: FLOW_PARAMS.consultationInsights
        });

        if (output && output.insights) {
            if (input.glossary) {
                const { artifact } = applyGlossaryToStructured(output, input.glossary, ['insights[].text', 'insights[].rationale']);
                output.insights = artifact.insights;
            }

            return output.insights.map((i: any) => ({
                ...i,
                sources: [{ chunkIndex: chunk.chunkIndex, snippet: chunk.text.substring(0, 50) + "..." }]
            }));
        }
        return [];
    });

    const results = await Promise.all(promises);
    results.forEach(res => allInsights.push(...res));

    const aggregatedInsights: any[] = [];
    const map = new Map<string, any>();

    for (const insight of allInsights) {
        const key = `${insight.type}:${insight.text.toLowerCase().trim()}`;
        if (map.has(key)) {
            const existing = map.get(key)!;
            if (insight.sources) {
                existing.sources = [...(existing.sources || []), ...insight.sources];
            }
        } else {
            map.set(key, insight);
        }
    }

    return { insights: Array.from(map.values()) };
}
