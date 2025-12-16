'use server';

/**
 * @fileOverview AI-assisted draft report generation for educational psychologists.
 *
 * - generateDraftReport - A function that generates a draft report based on assessment data and notes.
 * - GenerateDraftReportInput - The input type for the generateDraftReport function.
 * - GenerateDraftReportOutput - The return type for the generateDraftReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDraftReportInputSchema = z.object({
  assessmentData: z.string().describe('Assessment data in JSON format.'),
  notes: z.string().describe('Notes related to the child.'),
});
export type GenerateDraftReportInput = z.infer<typeof GenerateDraftReportInputSchema>;

const GenerateDraftReportOutputSchema = z.object({
  report: z.string().describe('Draft report summarizing strengths, challenges, and recommended interventions.'),
});
export type GenerateDraftReportOutput = z.infer<typeof GenerateDraftReportOutputSchema>;

export async function generateDraftReport(input: GenerateDraftReportInput): Promise<GenerateDraftReportOutput> {
  return generateDraftReportFlow(input);
}

const generateDraftReportPrompt = ai.definePrompt({
  name: 'generateDraftReportPrompt',
  input: {schema: GenerateDraftReportInputSchema},
  output: {schema: GenerateDraftReportOutputSchema},
  prompt: `You are an experienced educational psychologist. Generate a draft report summarizing the child's strengths, challenges, and recommended interventions based on the assessment data and notes provided. 

Assessment Data: {{{assessmentData}}}

Notes: {{{notes}}}

Report: `,
});

const generateDraftReportFlow = ai.defineFlow(
  {
    name: 'generateDraftReportFlow',
    inputSchema: GenerateDraftReportInputSchema,
    outputSchema: GenerateDraftReportOutputSchema,
  },
  async input => {
    const {output} = await generateDraftReportPrompt(input);
    return output!;
  }
);
