// src/integrations/documentAI/pipeline.ts

import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { processImport } from "../csv/importer";

/**
 * Document AI Pipeline v2
 * Mocks OCR and structured extraction.
 */

export interface ExtractedCell {
    value: string;
    confidence: number;
    box?: [number, number, number, number];
}

export interface ExtractionResult {
    rows: Record<string, ExtractedCell>[];
    summary: { total: number; valid: number };
}

export async function processDocument(file: File, category: string): Promise<string> {
    // 1. Create Run Record
    const runRef = await addDoc(collection(db, "docExtractionRuns"), {
        tenantId: "default",
        fileName: file.name,
        category,
        status: "processing",
        createdAt: new Date().toISOString()
    });

    // Simulate OCR delay
    await new Promise(r => setTimeout(r, 2000));

    // 2. Mock Extraction based on Category
    let mockData: ExtractionResult = { rows: [], summary: { total: 0, valid: 0 } };

    if (category === 'results') {
        mockData.rows = [
            { 
                "Student Name": { value: "Alice Smith", confidence: 0.98 },
                "Subject": { value: "Math", confidence: 0.95 },
                "Score": { value: "85", confidence: 0.99 }
            },
            { 
                "Student Name": { value: "Bob Jones", confidence: 0.92 },
                "Subject": { value: "Math", confidence: 0.90 },
                "Score": { value: "72", confidence: 0.85 }
            }
        ];
    } else {
        // Generic Mock
        mockData.rows = [
            { "Field 1": { value: "Sample Data", confidence: 0.9 }, "Field 2": { value: "123", confidence: 0.8 } }
        ];
    }
    
    mockData.summary.total = mockData.rows.length;
    mockData.summary.valid = mockData.rows.length; // Mock validation pass

    // 3. Save Result
    await updateDoc(doc(db, "docExtractionRuns", runRef.id), {
        status: "needs_review",
        extractedDataPreview: mockData,
        updatedAt: new Date().toISOString()
    });

    return runRef.id;
}

export async function commitRun(runId: string, data: any[], entityType: 'student' | 'result'): Promise<void> {
    // Convert to flat objects if needed
    const flatData = data.map(row => {
        const obj: any = {};
        Object.keys(row).forEach(k => obj[k] = row[k].value);
        return obj;
    });

    // Create Import Job
    const jobRef = await addDoc(collection(db, "importJobs"), {
        tenantId: "default",
        integrationId: "doc_ai_v2",
        sourceType: "document",
        entityType,
        status: "validating",
        createdAt: new Date().toISOString()
    });

    // Reuse existing import logic (mock for result type if needed, or assume students)
    if (entityType === 'student') {
        await processImport(flatData, 'student', jobRef.id);
    } else {
        // Mock import for other types
        await updateDoc(doc(db, "importJobs", jobRef.id), { status: "completed", counts: { created: flatData.length } });
    }

    // Update Run
    await updateDoc(doc(db, "docExtractionRuns", runId), { status: "approved" });
}
