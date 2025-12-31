'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';

// Schema for Evidence Items
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

  // New Audit Fields
  locale: z.string().optional().default('en-GB'),
  languageLabel: z.string().optional().default('English (UK)'),
  glossary: z.record(z.string()).optional(),
  evidence: z.array(EvidenceInputSchema).optional(),
});
export type ConsultationReportInput = z.infer<typeof ConsultationReportInputSchema>;

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

// Converted to Flow for dynamic composition
export const generateConsultationReportFlow = ai.defineFlow(
  {
    name: 'generateConsultationReportFlow',
    inputSchema: ConsultationReportInputSchema,
    outputSchema: ConsultationReportOutputSchema,
  },
  async (input) => {
    // 1. Compose Prompt
    const promptText = composeConsultationPrompt({
        baseInstruction: `You are an expert clinical documentation assistant. Draft a formal consultation report for student ${input.studentName} (Age: ${input.age || 'Unknown'}).
        Format: ${input.templateType}
        
        Instructions:
        1. Synthesize the transcript and notes into a professional clinical narrative.
        2. Structure the output according to the requested format (SOAP: Subjective, Objective, Assessment, Plan).
        3. Ensure the tone is objective, empathetic, and professional.
        4. Highlight any differential diagnoses mentioned or implied by the symptoms.
        5. Create a clear, actionable plan section.`,
        transcript: input.transcript,
        notes: input.notes,
        studentHistory: input.historySummary,
        locale: input.locale,
        languageLabel: input.languageLabel,
        glossary: input.glossary,
        evidence: input.evidence as EvidenceItem[],
    });

    // 2. Call LLM
    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: ConsultationReportOutputSchema },
        config: FLOW_PARAMS.consultationReport // Use Centralized Params
    });

    if (!output) {
        throw new Error("Report generation failed.");
    }

    return output;
  }
);
