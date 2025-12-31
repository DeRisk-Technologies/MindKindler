'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DifferentialDiagnosisInputSchema = z.object({
  caseDescription: z.string().describe('Detailed description of the student case, symptoms, and observations.'),
  age: z.number().describe('Age of the student.'),
});
export type DifferentialDiagnosisInput = z.infer<typeof DifferentialDiagnosisInputSchema>;

const DifferentialDiagnosisOutputSchema = z.object({
  suggestions: z.array(z.object({
    diagnosis: z.string(),
    reasoning: z.string(),
    confidence: z.enum(['low', 'medium', 'high']),
    recommendedAssessments: z.array(z.string()).describe('Further tests to confirm this diagnosis.')
  })),
  disclaimer: z.string(),
});
export type DifferentialDiagnosisOutput = z.infer<typeof DifferentialDiagnosisOutputSchema>;

export async function generateDifferentialDiagnosis(input: DifferentialDiagnosisInput): Promise<DifferentialDiagnosisOutput> {
  return differentialDiagnosisFlow(input);
}

const differentialDiagnosisPrompt = ai.definePrompt({
  name: 'differentialDiagnosisPrompt',
  input: { schema: DifferentialDiagnosisInputSchema },
  output: { schema: DifferentialDiagnosisOutputSchema },
  prompt: `You are an expert educational psychologist assistant. Analyze the following case description for a {{age}} year old student and suggest possible differential diagnoses.
  
  Case Description:
  {{caseDescription}}
  
  Provide 3-5 potential diagnoses. Be objective and clinical.
  ALWAYS include a disclaimer that these are AI-generated suggestions to assist the professional and do not constitute a medical diagnosis.
  `,
});

const differentialDiagnosisFlow = ai.defineFlow(
  {
    name: 'differentialDiagnosisFlow',
    inputSchema: DifferentialDiagnosisInputSchema,
    outputSchema: DifferentialDiagnosisOutputSchema,
  },
  async (input) => {
    const { output } = await differentialDiagnosisPrompt(input);
    return output!;
  }
);
