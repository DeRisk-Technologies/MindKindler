// src/services/dedupe-service.ts

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

export interface DedupeCandidate {
    docId: string;
    similarity: 'exact' | 'high' | 'medium';
    reason: string;
    existingStatus: string;
    uploadedAt: any;
}

export const DedupeService = {
    /**
     * Checks for exact file hash matches.
     */
    async checkHashDuplicate(tenantId: string, hash: string): Promise<DedupeCandidate[]> {
        const q = query(
            collection(db, `tenants/${tenantId}/documents`), 
            where('hash', '==', hash),
            orderBy('uploadedAt', 'desc'),
            limit(5)
        );
        
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            docId: doc.id,
            similarity: 'exact',
            reason: 'Identical file hash',
            existingStatus: doc.data().status,
            uploadedAt: doc.data().uploadedAt
        }));
    },

    /**
     * Checks for fuzzy matches based on metadata (e.g. same student + category + date).
     * This is a client-side heuristic or could be a cloud function. 
     * For now, client-side query.
     */
    async checkFuzzyMatch(tenantId: string, metadata: { studentId?: string, category: string, date?: string }): Promise<DedupeCandidate[]> {
        if (!metadata.studentId) return [];

        // Check for documents with same student and category uploaded recently
        // Firestore doesn't support complex ORs easily, so we query strictly on student+category
        const q = query(
            collection(db, `tenants/${tenantId}/documents`),
            where('studentId', '==', metadata.studentId),
            where('category', '==', metadata.category),
            orderBy('uploadedAt', 'desc'),
            limit(5)
        );

        const snap = await getDocs(q);
        // Simple heuristic: if date matches or filename is very similar
        return snap.docs.map(doc => {
            const data = doc.data();
            let similarity: 'high' | 'medium' = 'medium';
            // Placeholder logic for text similarity
            return {
                docId: doc.id,
                similarity,
                reason: 'Same student and category',
                existingStatus: data.status,
                uploadedAt: data.uploadedAt
            };
        });
    }
};
