'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConsultationReportInputSchema = z.object({
  studentName: z.string(),
  age: z.number().optional(),
  transcript: z.string().optional(),
  notes: z.string().optional(),
  historySummary: z.string().optional(),
  templateType: z.enum(['SOAP', 'DAP', 'Narrative']).default('SOAP'),
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

const generateConsultationReportPrompt = ai.definePrompt({
  name: 'generateConsultationReportPrompt',
  input: { schema: ConsultationReportInputSchema },
  output: { schema: ConsultationReportOutputSchema },
  prompt: `You are an expert clinical documentation assistant. Draft a formal consultation report for student {{studentName}} (Age: {{age}}) based on the provided session data.
  
  Format: {{templateType}}
  
  Session Transcript (Raw):
  {{transcript}}
  
  Clinician Notes:
  {{notes}}
  
  Student History:
  {{historySummary}}
  
  Instructions:
  1. Synthesize the transcript and notes into a professional clinical narrative.
  2. Structure the output according to the requested format (SOAP: Subjective, Objective, Assessment, Plan).
  3. Ensure the tone is objective, empathetic, and professional.
  4. Highlight any differential diagnoses mentioned or implied by the symptoms.
  5. Create a clear, actionable plan section.
  `,
});

const generateConsultationReportFlow = ai.defineFlow(
  {
    name: 'generateConsultationReportFlow',
    inputSchema: ConsultationReportInputSchema,
    outputSchema: ConsultationReportOutputSchema,
  },
  async (input) => {
    const { output } = await generateConsultationReportPrompt(input);
    return output!;
  }
);
