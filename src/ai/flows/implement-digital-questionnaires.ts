'use server';
/**
 * @fileOverview Implements digital questionnaires and auto-scoring of results.
 *
 * - implementDigitalQuestionnaires - A function to handle the implementation and scoring of digital questionnaires.
 * - ImplementDigitalQuestionnairesInput - The input type for the implementDigitalQuestionnaires function.
 * - ImplementDigitalQuestionnairesOutput - The return type for the implementDigitalQuestionnaires function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImplementDigitalQuestionnairesInputSchema = z.object({
  questionnaireData: z
    .string()
    .describe('The data of the questionnaire, including questions and answers.'),
  scoringCriteria: z
    .string()
    .describe('The criteria used to score the questionnaire results.'),
});
export type ImplementDigitalQuestionnairesInput = z.infer<
  typeof ImplementDigitalQuestionnairesInputSchema
>;

const ImplementDigitalQuestionnairesOutputSchema = z.object({
  score: z.number().describe('The calculated score of the questionnaire.'),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The risk level associated with the questionnaire score.'),
  report: z.string().describe('A summary report of the questionnaire results.'),
});
export type ImplementDigitalQuestionnairesOutput = z.infer<
  typeof ImplementDigitalQuestionnairesOutputSchema
>;

export async function implementDigitalQuestionnaires(
  input: ImplementDigitalQuestionnairesInput
): Promise<ImplementDigitalQuestionnairesOutput> {
  return implementDigitalQuestionnairesFlow(input);
}

const implementDigitalQuestionnairesPrompt = ai.definePrompt({
  name: 'implementDigitalQuestionnairesPrompt',
  input: {schema: ImplementDigitalQuestionnairesInputSchema},
  output: {schema: ImplementDigitalQuestionnairesOutputSchema},
  prompt: `You are an expert in analyzing questionnaire data and providing risk assessments.

Given the following questionnaire data and scoring criteria, calculate the score, determine the risk level (low, medium, or high), and generate a summary report.

Questionnaire Data: {{{questionnaireData}}}
Scoring Criteria: {{{scoringCriteria}}}

Ensure the risk level aligns with the score and the scoring criteria.
`,
});

const implementDigitalQuestionnairesFlow = ai.defineFlow(
  {
    name: 'implementDigitalQuestionnairesFlow',
    inputSchema: ImplementDigitalQuestionnairesInputSchema,
    outputSchema: ImplementDigitalQuestionnairesOutputSchema,
  },
  async input => {
    const {output} = await implementDigitalQuestionnairesPrompt(input);
    return output!;
  }
);
