'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateContentInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.enum(['Hausa', 'Yoruba', 'Igbo']).describe('The target language for translation.'),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

const TranslateContentOutputSchema = z.object({
  translatedText: z.string(),
});
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const translateContentPrompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: { schema: TranslateContentInputSchema },
  output: { schema: TranslateContentOutputSchema },
  prompt: `Translate the following educational report or note into {{targetLanguage}}. Ensure the tone remains professional yet accessible to parents.
  
  Text:
  {{text}}
  `,
});

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async (input) => {
    const { output } = await translateContentPrompt(input);
    return output!;
  }
);
