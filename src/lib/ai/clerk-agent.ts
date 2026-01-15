import { EvidenceCategory, IngestionAnalysis } from "../../types/evidence";

/**
 * "The Clerk" - AI Agent for Document Ingestion.
 * 
 * This service is responsible for taking raw text from OCR/Documents and 
 * using a Large Language Model (Gemini 1.5 Flash) to structure it.
 * 
 * It focuses on:
 * 1. Identifying People (Stakeholders) to populate the contact map.
 * 2. Identifying Dates to sanity check the Statutory Timeline.
 * 3. Categorizing the document to help the "Gap Scanner".
 * 4. Spotting Risks immediately.
 */

// TODO: In a real implementation, import the Vertex AI SDK
// import { VertexAI } from '@google-cloud/vertexai';

export class ClerkAgent {
    
    /**
     * Analyzes document text to extract structured metadata.
     * 
     * @param text - The raw text content of the document.
     * @param fileName - The filename (useful context for categorization).
     * @returns A Promise resolving to the structured analysis.
     */
    async analyzeDocument(text: string, fileName: string): Promise<IngestionAnalysis> {
        
        // 1. Construct the System Prompt
        // We use a Zero-Shot CoT (Chain of Thought) approach with JSON enforcement.
        const systemPrompt = `
You are "The Clerk", an expert Clinical Administrative Assistant for a UK Educational Psychology practice.
Your goal is to analyze a raw text document from a Special Educational Needs (SEND) case file and extract structured data.

Current File Name: "${fileName}"

Please analyze the text below and output a STRICT JSON object. Do not include markdown formatting (like \`\`\`json).

Output Schema:
{
  "extractedStakeholders": [
    { "name": string, "role": "parent" | "senco" | "social_worker" | "pediatrician" | "class_teacher" | "unknown", "email": string | null, "phone": string | null, "confidenceScore": number }
  ],
  "detectedDates": [
    { "label": "dob" | "request_date" | "incident_date" | "assessment_date", "dateIso": "YYYY-MM-DD", "context": string }
  ],
  "suggestedCategory": "parental_advice" | "school_report" | "medical_report" | "social_care_report" | "previous_ehcp" | "hearing_vision" | "speech_language" | "other",
  "confidence": number,
  "riskSignals": string[], // List any mentions of: Safeguarding, Suicide, Self-harm, Tribunal, Exclusion, Abuse, Legal Action
  "summary": string // A concise 2-sentence summary of what this document is.
}

Rules:
- If you find a name like "Mrs. Smith (SENCO)", map role to "senco".
- If you see "DOB: 12/05/2015", map to "dob".
- If the file seems to be a list of grades/attendance, map to "school_report".
- If the file is a formal letter from a parent describing their child, map to "parental_advice".
- BE VIGILANT for Risk. If phrases like "intent to harm", "suspended", "excluded", or "lawyer" appear, flag them in riskSignals.
`;

        // 2. Prepare the Payload
        // This is where we would call the actual LLM.
        // const response = await model.generateContent([systemPrompt, text]);
        
        console.log(`[ClerkAgent] Analyzing ${fileName} with prompt length: ${systemPrompt.length + text.length}`);

        // TODO: Call Vertex AI here. 
        // For Phase 46, we will return a MOCK response to simulate the architecture.
        
        return this.mockResponse(fileName);
    }

    /**
     * MOCK function to simulate AI behavior during development/testing without incurring costs.
     */
    private mockResponse(fileName: string): IngestionAnalysis {
        const isMedical = fileName.toLowerCase().includes('clinic') || fileName.toLowerCase().includes('medical');
        const isSchool = fileName.toLowerCase().includes('school') || fileName.toLowerCase().includes('report');
        
        return {
            fileId: 'generated-by-ingestion', // This would be the actual ID in a real flow
            extractedStakeholders: [
                {
                    name: "Jane Doe",
                    role: "parent",
                    email: "jane.doe@example.com",
                    confidenceScore: 0.95
                },
                {
                    name: "Mr. Thompson",
                    role: "senco",
                    email: "senco@school.org",
                    confidenceScore: 0.88
                }
            ],
            detectedDates: [
                {
                    label: "dob",
                    dateIso: "2015-05-20",
                    context: "Subject DOB: 20/05/2015 found in header"
                }
            ],
            suggestedCategory: isMedical ? 'medical_report' : (isSchool ? 'school_report' : 'other'),
            confidence: 0.9,
            riskSignals: fileName.toLowerCase().includes('urgent') ? ['Potential escalation flag in filename'] : [],
            summary: "This document appears to be a standard contribution. Extracted 2 potential contacts."
        };
    }
}
