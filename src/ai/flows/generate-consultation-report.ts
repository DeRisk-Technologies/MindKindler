'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { applyGlossaryToStructured } from '@/ai/utils/glossarySafeApply';

// Schema definitions kept outside but ensuring no 'export const' that are objects.
// 'use server' requires exported values to be serializable or async functions.

export async function generateConsultationReport(input: any) {
  
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

  const promptText = composeConsultationPrompt({
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
