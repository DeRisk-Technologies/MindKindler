// functions/src/ai/flows/extractDocumentFlow.ts

import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { saveAiProvenance } from "../utils/provenance";
import { applyGlossaryToStructured } from "../utils/glossarySafeApply";
import { z } from "zod";

const ai = genkit({
    plugins: [googleAI()],
    model: "googleai/gemini-1.5-flash",
});

// Schemas
const AcademicRecordSchema = z.object({
    studentName: z.string().optional(),
    term: z.string().optional(),
    subjects: z.array(z.object({
        name: z.string(),
        grade: z.string(),
        score: z.number().optional(),
        comments: z.string().optional()
    })),
    gpa: z.number().optional(),
    attendancePercentage: z.number().optional()
});

const AttendanceLogSchema = z.object({
    totalDays: z.number(),
    present: z.number(),
    absent: z.number(),
    tardy: z.number(),
    patterns: z.array(z.string()).optional() // e.g. "Frequent Monday absence"
});

// Generic fall-back
const GenericDocSchema = z.object({
    summary: z.string(),
    keyEntities: z.array(z.string()),
    dates: z.array(z.string()),
    actionItems: z.array(z.string()).optional()
});

export async function runExtraction(
    tenantId: string, 
    text: string, 
    category: string, 
    glossary: Record<string, string>,
    userId: string
) {
    const startTime = Date.now();
    let schema;
    let promptInstruction = "";

    switch(category) {
        case 'academic_record':
            schema = AcademicRecordSchema;
            promptInstruction = "Extract academic grades, subjects, and term details.";
            break;
        case 'attendance_log':
            schema = AttendanceLogSchema;
            promptInstruction = "Extract attendance statistics and patterns.";
            break;
        default:
            schema = GenericDocSchema;
            promptInstruction = "Summarize the document and extract key entities and dates.";
    }

    const prompt = `
    You are a data extraction assistant.
    Category: ${category}
    Task: ${promptInstruction}
    
    Document Text:
    "${text.substring(0, 30000)}" 
    
    Return valid JSON strictly matching the schema.
    `;

    const { output } = await ai.generate({ 
        prompt, 
        config: { temperature: 0.0 } 
    });

    const rawText = output?.text || "{}";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    
    try {
        parsed = JSON.parse(cleanJson);
        // Soft validation - log warning but keep data if partial match
        schema.parse(parsed);
    } catch (e: any) {
        console.warn(`Extraction Validation Warning: ${e.message}`);
        // Attempt repair logic here if critical
    }

    // Apply Glossary
    const { artifact, replacements } = applyGlossaryToStructured(parsed, glossary);

    // Save Provenance
    const provId = await saveAiProvenance({
        tenantId,
        studentId: 'unknown', // Linked later
        flowName: 'extractDocumentFlow',
        prompt,
        model: 'googleai/gemini-1.5-flash',
        responseText: rawText,
        parsedOutput: { ...artifact, glossaryReplacements: replacements },
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    return {
        data: artifact,
        provenanceId: provId,
        confidence: 0.9 // Mock confidence for V1 (Genkit doesn't always return per-field confidence yet)
    };
}
