'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { chunkTranscript, normalizeSpeakerTags } from '@/ai/utils/transcript';

// Schema for Evidence Items in Input
const EvidenceInputSchema = z.object({
  sourceId: z.string(),
  type: z.string(),
  snippet: z.string(),
  trust: z.number(),
});

// Expanded Input Schema to accept full transcript
export const ConsultationInsightsInputSchema = z.object({
  transcriptChunk: z.string().optional(), // Legacy single chunk support
  fullTranscript: z.string().optional(), // New full processing
  currentNotes: z.string().optional(),
  studentAge: z.number().optional(),
  
  // New Audit Fields
  locale: z.string().optional().default('en-GB'),
  languageLabel: z.string().optional().default('English (UK)'),
  glossary: z.record(z.string()).optional(),
  evidence: z.array(EvidenceInputSchema).optional(),
});
export type ConsultationInsightsInput = z.infer<typeof ConsultationInsightsInputSchema>;

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

// Convert to Flow to allow dynamic prompt construction
export const generateConsultationInsightsFlow = ai.defineFlow(
  {
    name: 'generateConsultationInsightsFlow',
    inputSchema: ConsultationInsightsInputSchema,
    outputSchema: ConsultationInsightsOutputSchema,
  },
  async (input) => {
    // Determine input source: Full Transcript vs Chunk
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

    // Process Chunks (Parallel or Serial? Serial usually safer for consistency context but Parallel faster)
    // For insights extraction, parallel is fine as chunks are somewhat independent context-wise.
    const promises = chunks.map(async (chunk) => {
        // 1. Compose Dynamic Prompt
        const promptText = composeConsultationPrompt({
            baseInstruction: `You are a real-time AI Co-Pilot for an educational psychologist. Analyze the following transcript chunk (${chunk.chunkIndex + 1}/${chunk.totalChunks}) for a student (Age: ${input.studentAge || 'Unknown'}).
            
            Task:
            Identify any potential differential diagnoses, treatment ideas, risk factors (e.g. self-harm, abuse), or key observations.
            
            Output a list of concise insights.
            - If a symptom matches a diagnosis (e.g. ADHD, Dyslexia, Anxiety), suggest it with 'diagnosis' type.
            - If an intervention is implied, suggest it with 'treatment' type.
            - If there is a safety concern, use 'risk' type (High Confidence).
            
            Be conservative but helpful.`,
            transcript: chunk.text,
            notes: input.currentNotes,
            locale: input.locale,
            languageLabel: input.languageLabel,
            glossary: input.glossary,
            evidence: input.evidence as EvidenceItem[],
        });

        // 2. Call LLM
        const { output } = await ai.generate({
            prompt: promptText,
            output: { schema: ConsultationInsightsOutputSchema },
            config: FLOW_PARAMS.consultationInsights
        });

        if (output && output.insights) {
            // Tag with source info
            return output.insights.map(i => ({
                ...i,
                sources: [{ chunkIndex: chunk.chunkIndex, snippet: chunk.text.substring(0, 50) + "..." }]
            }));
        }
        return [];
    });

    const results = await Promise.all(promises);
    results.forEach(res => allInsights.push(...res));

    // Aggregation / Deduplication Logic
    const aggregatedInsights: typeof allInsights = [];
    const map = new Map<string, typeof allInsights[0]>();

    for (const insight of allInsights) {
        const key = `${insight.type}:${insight.text.toLowerCase().trim()}`;
        
        if (map.has(key)) {
            const existing = map.get(key)!;
            // Merge Sources
            if (insight.sources) {
                existing.sources = [...(existing.sources || []), ...insight.sources];
            }
            // Boost confidence if repeated? (Simple logic: if >1 occurrence, bump to medium if low)
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
