'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConsultationInsightsInputSchema = z.object({
  transcriptChunk: z.string(),
  currentNotes: z.string().optional(),
  studentAge: z.number().optional(),
});
export type ConsultationInsightsInput = z.infer<typeof ConsultationInsightsInputSchema>;

const InsightSchema = z.object({
  type: z.enum(['diagnosis', 'treatment', 'risk', 'observation']),
  text: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  rationale: z.string().optional(),
});

const ConsultationInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema),
});
export type ConsultationInsightsOutput = z.infer<typeof ConsultationInsightsOutputSchema>;

export async function generateConsultationInsights(input: ConsultationInsightsInput): Promise<ConsultationInsightsOutput> {
  return generateConsultationInsightsFlow(input);
}

const generateConsultationInsightsPrompt = ai.definePrompt({
  name: 'generateConsultationInsightsPrompt',
  input: { schema: ConsultationInsightsInputSchema },
  output: { schema: ConsultationInsightsOutputSchema },
  prompt: `You are a real-time AI Co-Pilot for an educational psychologist. Analyze the following transcript chunk from an ongoing consultation for a student (Age: {{studentAge}}).
  
  Transcript Chunk:
  "{{transcriptChunk}}"
  
  Current Notes context:
  "{{currentNotes}}"
  
  Task:
  Identify any potential differential diagnoses, treatment ideas, risk factors (e.g. self-harm, abuse), or key observations.
  
  Output a list of concise insights.
  - If a symptom matches a diagnosis (e.g. ADHD, Dyslexia, Anxiety), suggest it with 'diagnosis' type.
  - If an intervention is implied, suggest it with 'treatment' type.
  - If there is a safety concern, use 'risk' type (High Confidence).
  
  Be conservative but helpful.
  `,
});

const generateConsultationInsightsFlow = ai.defineFlow(
  {
    name: 'generateConsultationInsightsFlow',
    inputSchema: ConsultationInsightsInputSchema,
    outputSchema: ConsultationInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await generateConsultationInsightsPrompt(input);
    return output!;
  }
);
