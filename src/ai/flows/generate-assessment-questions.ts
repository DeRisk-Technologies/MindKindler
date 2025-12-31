'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssessmentQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic or learning standard for the assessment.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level of the questions.'),
  count: z.number().min(1).max(20).describe('Number of questions to generate.'),
  questionType: z.enum(['mixed', 'multiple-choice', 'essay', 'audio']).describe('Type of questions to generate.'),
});
export type AssessmentQuestionsInput = z.infer<typeof AssessmentQuestionsInputSchema>;

const QuestionSchema = z.object({
  text: z.string(),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay', 'scale', 'audio-response', 'video-response']),
  options: z.array(z.string()).optional().describe('Options for multiple choice questions. Should have 4 options if MC.'),
  correctAnswer: z.string().optional().describe('The correct answer key.'),
  points: z.number().default(1),
  hint: z.string().optional().describe('A helpful hint for the student.'),
});

const AssessmentQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});
export type AssessmentQuestionsOutput = z.infer<typeof AssessmentQuestionsOutputSchema>;

// Only export the async action function to satisfy 'use server' constraints
export async function generateAssessmentQuestions(input: AssessmentQuestionsInput): Promise<AssessmentQuestionsOutput> {
  return generateAssessmentQuestionsFlow(input);
}

const generateAssessmentQuestionsPrompt = ai.definePrompt({
  name: 'generateAssessmentQuestionsPrompt',
  input: { schema: AssessmentQuestionsInputSchema },
  output: { schema: AssessmentQuestionsOutputSchema },
  prompt: `You are an expert educational psychologist and curriculum developer. Create a list of {{count}} assessment questions about "{{topic}}".
  
  Difficulty Level: {{difficulty}}
  Preferred Question Type: {{questionType}}
  
  Instructions:
  - If questionType is 'mixed', include a variety of Multiple Choice, True/False, and Short Answer.
  - If questionType is 'multiple-choice', ensure all questions have 4 plausible options.
  - If questionType is 'essay', create open-ended prompts.
  - If questionType is 'audio', focus on oral comprehension or verbal response prompts (use 'audio-response' type).
  
  For each question, provide:
  - Clear question text appropriate for the difficulty level.
  - Correct answer key.
  - Points value (usually 1 for simple, more for essay).
  - A helpful hint that guides the student without giving the answer.
  `,
});

const generateAssessmentQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAssessmentQuestionsFlow',
    inputSchema: AssessmentQuestionsInputSchema,
    outputSchema: AssessmentQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateAssessmentQuestionsPrompt(input);
    return output!;
  }
);
