// src/ai/guardian/audit-log.ts

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ProvenanceMetadata } from '@/types/schema';

export interface AuditEntry {
    tenantId: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'ai_generate';
    resourceType: 'student' | 'report' | 'case';
    resourceId: string;
    actorId: string; // User ID
    details: string;
    metadata?: Record<string, any>;
    redactedFields?: string[]; // Log which fields were hidden if it was a read
}

const AUDIT_COLLECTION = 'audit_logs';

export async function logAuditEvent(entry: Omit<AuditEntry, 'timestamp'>) {
    try {
        await addDoc(collection(db, AUDIT_COLLECTION), {
            ...entry,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Fail open or closed depending on policy? Usually just log error to console so user flow isn't broken.
    }
}

export async function logAiProvenance(
    tenantId: string,
    studentId: string,
    feature: string,
    prompt: string,
    output: string,
    sources: any[],
    confidence: number
) {
    // Specialized log for AI trust
    await addDoc(collection(db, 'ai_provenance'), {
        tenantId,
        studentId,
        feature,
        promptHash: crypto.subtle ? 'hashed' : 'raw', // In real app, hash PII in prompts
        outputLength: output.length,
        sources,
        confidence,
        timestamp: serverTimestamp()
    });
}
