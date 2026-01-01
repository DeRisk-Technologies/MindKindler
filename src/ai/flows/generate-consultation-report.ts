'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { applyGlossaryToStructured } from '@/ai/utils/glossarySafeApply';

// ... (Schemas match previous) ...
const EvidenceInputSchema = z.object({
  sourceId: z.string(),
  type: z.string(),
  snippet: z.string(),
  trust: z.number(),
});

export const ConsultationReportInputSchema = z.object({
  studentName: z.string(),
  age: z.number().optional(),
  transcript: z.string().optional(),
  notes: z.string().optional(),
  historySummary: z.string().optional(),
  templateType: z.enum(['SOAP', 'DAP', 'Narrative']).default('SOAP'),
  locale: z.string().optional().default('en-GB'),
  languageLabel: z.string().optional().default('English (UK)'),
  glossary: z.record(z.string()).optional(),
  evidence: z.array(EvidenceInputSchema).optional(),
});
export type ConsultationReportInput = z.input<typeof ConsultationReportInputSchema>;

const ConsultationReportOutputSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })),
  summary: z.string(),
  suggestedDiagnoses: z.array(z.string()).optional(),
  plan: z.array(z.string()).optional(),
});
export type ConsultationReportOutput = z.infer<typeof ConsultationReportOutputSchema>;

export async function generateConsultationReport(input: ConsultationReportInput): Promise<ConsultationReportOutput> {
  return generateConsultationReportFlow(input);
}

export const generateConsultationReportFlow = ai.defineFlow(
  {
    name: 'generateConsultationReportFlow',
    inputSchema: ConsultationReportInputSchema,
    outputSchema: ConsultationReportOutputSchema,
  },
  async (input) => {
    const promptText = composeConsultationPrompt({
        // ... (Prompt Composition matches previous) ...
        baseInstruction: `You are an expert clinical documentation assistant. Draft a formal consultation report for student ${input.studentName} (Age: ${input.age || 'Unknown'}). Format: ${input.templateType}. Instructions: Synthesize transcript/notes into clinical narrative. Structure as requested. Tone: objective, empathetic, professional.`,
        transcript: input.transcript,
        notes: input.notes,
        studentHistory: input.historySummary,
        locale: input.locale,
        languageLabel: input.languageLabel,
        glossary: input.glossary,
        evidence: input.evidence as EvidenceItem[],
    });

    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: ConsultationReportOutputSchema },
        config: FLOW_PARAMS.consultationReport
    });

    if (!output) {
        throw new Error("Report generation failed.");
    }

    // Glossary Enforcement
    if (input.glossary) {
        const { artifact } = applyGlossaryToStructured(output, input.glossary, [
            'title', 
            'sections[].content', 
            'summary', 
            'plan[]',
            'suggestedDiagnoses[]'
        ]);
        return artifact;
    }

    return output;
  }
);
