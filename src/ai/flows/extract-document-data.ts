'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DocumentExtractionInputSchema = z.object({
  documentText: z.string().describe('The raw text content extracted from the document (OCR result).'),
  category: z.enum([
    'academic_record', 
    'school_report', // Added alias
    'attendance_log', 
    'iep_document', 
    'lesson_plan', 
    'clinical_note', 
    'admin_record'
  ]).describe('The category of the document.'),
});
export type DocumentExtractionInput = z.infer<typeof DocumentExtractionInputSchema>;

// Generic flexible output schema that changes interpretation based on category
// In a production app, we might use distinct flows per category for tighter typing.
const DocumentExtractionOutputSchema = z.object({
  extractedData: z.record(z.any()).describe('The structured data extracted from the document.'),
  confidence: z.number().describe('Confidence score from 0 to 1.'),
  summary: z.string().describe('Brief summary of what was found.'),
});
export type DocumentExtractionOutput = z.infer<typeof DocumentExtractionOutputSchema>;

export async function extractDocumentData(input: DocumentExtractionInput): Promise<DocumentExtractionOutput> {
  return extractDocumentDataFlow(input);
}

const extractDocumentDataPrompt = ai.definePrompt({
  name: 'extractDocumentDataPrompt',
  input: { schema: DocumentExtractionInputSchema },
  output: { schema: DocumentExtractionOutputSchema },
  prompt: `You are an expert data extraction assistant for an educational platform (MindKindler).
  
  Document Category: {{category}}
  
  Raw Document Text:
  """
  {{documentText}}
  """
  
  Task: Extract structured information relevant to the category.
  
  - If 'academic_record' or 'school_report': 
    CRITICAL: Extract the specific REPORT DATE (e.g. "12/01/2024"). If fuzzy (e.g., "Fall 2023"), estimate the date (e.g., 2023-12-01).
    Identify the Academic Year (e.g., "2023-2024").
    For each subject row found, extract: 
      - Subject Name
      - Grade/Score (normalize to string)
      - Teacher Comment (full text)
    Output structure: { "records": [{ "subject": "Math", "grade": "A", "comment": "...", "date": "..." }], "academicYear": "..." }

  - If 'attendance_log': Extract student name, date, status (present/absent), and reason.
  - If 'iep_document': Extract diagnosis, goals, accommodations, and next review date.
  - If 'lesson_plan': Extract subject, topic, date, and learning objectives.
  
  Return the result as a valid JSON object in the 'extractedData' field.
  Provide a confidence score based on data completeness.
  `,
});

const extractDocumentDataFlow = ai.defineFlow(
  {
    name: 'extractDocumentDataFlow',
    inputSchema: DocumentExtractionInputSchema,
    outputSchema: DocumentExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await extractDocumentDataPrompt(input);
    return output!;
  }
);
