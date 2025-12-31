// src/integrations/csv/importer.ts

import { StudentImport } from "../schemas/canonical";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

export interface ImportError {
    row: number;
    message: string;
}

export interface ImportResult {
    total: number;
    created: number;
    errors: ImportError[];
}

export async function parseCSV(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
            resolve(rows);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export function validateRows(rows: string[][], mapping: Record<string, string>, headers: string[]): { valid: any[], errors: ImportError[] } {
    const valid: any[] = [];
    const errors: ImportError[] = [];

    // Skip header
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty rows

        const record: any = {};
        let rowValid = true;
        let missing = [];

        for (const [csvHeader, systemField] of Object.entries(mapping)) {
            const index = headers.indexOf(csvHeader);
            if (index === -1) continue;
            
            const value = row[index];
            
            // Simple validation: required fields
            if (['firstName', 'lastName', 'schoolId'].includes(systemField) && !value) {
                rowValid = false;
                missing.push(systemField);
            }
            
            record[systemField] = value;
        }

        if (rowValid) {
            valid.push(record);
        } else {
            errors.push({ row: i + 2, message: `Missing required fields: ${missing.join(', ')}` });
        }
    }

    return { valid, errors };
}

export async function processImport(records: any[], entityType: 'student', jobId: string): Promise<ImportResult> {
    let created = 0;
    const errors: ImportError[] = [];

    // Create Job Record Status
    await updateDoc(doc(db, "importJobs", jobId), { status: "importing" });

    for (let i = 0; i < records.length; i++) {
        try {
            const record = records[i];
            
            // Basic Upsert Logic (Mock: Just Create)
            if (entityType === 'student') {
                await addDoc(collection(db, "students"), {
                    ...record,
                    tenantId: "default",
                    createdAt: new Date().toISOString()
                });
            }
            created++;
        } catch (e: any) {
            errors.push({ row: i + 1, message: e.message });
        }
    }

    // Finalize Job
    await updateDoc(doc(db, "importJobs", jobId), { 
        status: errors.length === 0 ? "completed" : "completed_with_errors",
        counts: { rows: records.length, created, errors: errors.length },
        errors: errors.slice(0, 100) // Limit log size
    });

    return { total: records.length, created, errors };
}
