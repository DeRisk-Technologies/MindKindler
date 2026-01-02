'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { chunkTranscript, normalizeSpeakerTags } from '@/ai/utils/transcript';
import { applyGlossaryToStructured } from '@/ai/utils/glossarySafeApply';

// ... (Input Schemas omitted for brevity, match previous) ...
// Re-declaring minimally for context if file is replaced entirely
const EvidenceInputSchema = z.object({
  sourceId: z.string(),
  type: z.string(),
  snippet: z.string(),
  trust: z.number(),
});

export const ConsultationInsightsInputSchema = z.object({
  transcriptChunk: z.string().optional(),
  fullTranscript: z.string().optional(),
  currentNotes: z.string().optional(),
  studentAge: z.number().optional(),
  locale: z.string().optional().default('en-GB'),
  languageLabel: z.string().optional().default('English (UK)'),
  glossary: z.record(z.string()).optional(),
  evidence: z.array(EvidenceInputSchema).optional(),
});
export type ConsultationInsightsInput = z.input<typeof ConsultationInsightsInputSchema>;

const InsightSchema = z.object({
  type: z.enum(['diagnosis', 'treatment', 'risk', 'observation']),
  text: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  rationale: z.string().optional(),
  sources: z.array(z.object({
      chunkIndex: z.number(),
      snippet: z.string().optional()
  })).optional()
});

const ConsultationInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema),
});
export type ConsultationInsightsOutput = z.infer<typeof ConsultationInsightsOutputSchema>;

export async function generateConsultationInsights(input: ConsultationInsightsInput): Promise<ConsultationInsightsOutput> {
  return generateConsultationInsightsFlow(input);
}

export const generateConsultationInsightsFlow = ai.defineFlow(
  {
    name: 'generateConsultationInsightsFlow',
    inputSchema: ConsultationInsightsInputSchema,
    outputSchema: ConsultationInsightsOutputSchema,
  },
  async (input) => {
    let chunks = [];
    
    if (input.fullTranscript) {
        const normalized = normalizeSpeakerTags(input.fullTranscript);
        chunks = chunkTranscript(normalized);
    } else if (input.transcriptChunk) {
        chunks = [{ text: input.transcriptChunk, chunkIndex: 0, totalChunks: 1, startIndex: 0, endIndex: input.transcriptChunk.length }];
    } else {
        return { insights: [] };
    }

    const allInsights: z.infer<typeof InsightSchema>[] = [];

    const promises = chunks.map(async (chunk) => {
        const promptText = composeConsultationPrompt({
            // ... (Prompt Composition matches previous) ...
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
            // Apply Glossary Enforcement Here (Per Chunk)
            if (input.glossary) {
                const { artifact } = applyGlossaryToStructured(output, input.glossary, ['insights[].text', 'insights[].rationale']);
                // Re-assign processed insights
                output.insights = artifact.insights;
            }

            return output.insights.map(i => ({
                ...i,
                sources: [{ chunkIndex: chunk.chunkIndex, snippet: chunk.text.substring(0, 50) + "..." }]
            }));
        }
        return [];
    });

    const results = await Promise.all(promises);
    results.forEach(res => allInsights.push(...res));

    // Aggregation Logic (Matches previous)
    const aggregatedInsights: typeof allInsights = [];
    const map = new Map<string, typeof allInsights[0]>();

    for (const insight of allInsights) {
        const key = `${insight.type}:${insight.text.toLowerCase().trim()}`;
        if (map.has(key)) {
            const existing = map.get(key)!;
            if (insight.sources) {
                existing.sources = [...(existing.sources || []), ...insight.sources];
            }
            if (existing.confidence === 'low') existing.confidence = 'medium';
            if (existing.confidence === 'medium' && insight.confidence === 'high') existing.confidence = 'high';
        } else {
            map.set(key, insight);
            aggregatedInsights.push(insight);
        }
    }

    return { insights: Array.from(map.values()) };
  }
);
