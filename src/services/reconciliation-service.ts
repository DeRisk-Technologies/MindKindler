// src/services/reconciliation-service.ts

import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore";

export const ReconciliationService = {
    async approveExtraction(tenantId: string, stagingId: string, approverId: string, finalData: any) {
        const stagingRef = doc(db, `tenants/${tenantId}/document_staging/${stagingId}`);
        const stagingSnap = await getDoc(stagingRef);
        if (!stagingSnap.exists()) throw new Error("Staging doc not found");
        
        const stagingData = stagingSnap.data();
        const docId = stagingData.documentId;
        const docRef = doc(db, `tenants/${tenantId}/documents/${docId}`);

        // 1. Commit Staging
        await updateDoc(stagingRef, {
            status: 'committed',
            finalData,
            reviewedBy: approverId,
            reviewedAt: serverTimestamp()
        });

        // 2. Publish Document
        await updateDoc(docRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            publishedBy: approverId,
            metadata: { ...stagingData.aiResult?.data, ...finalData } // Merge extracted data into metadata for easy indexing
        });

        // 3. Save Structured Extraction Version
        await addDoc(collection(db, `tenants/${tenantId}/document_extractions`), {
            documentId: docId,
            data: finalData,
            version: 1, 
            validFrom: serverTimestamp(),
            provenanceId: stagingData.aiResult?.provenanceId
        });
    },

    async requestEPPReview(tenantId: string, stagingId: string, message: string, requestorId: string) {
        const stagingRef = doc(db, `tenants/${tenantId}/document_staging/${stagingId}`);
        
        await updateDoc(stagingRef, {
            status: 'pending_approval'
        });

        await addDoc(collection(db, `tenants/${tenantId}/reconciliation`), {
            stagingId,
            status: 'pending',
            priority: 'medium',
            message,
            requestedBy: requestorId,
            createdAt: serverTimestamp()
        });
    },

    async rejectExtraction(tenantId: string, stagingId: string, reason: string) {
        await updateDoc(doc(db, `tenants/${tenantId}/document_staging/${stagingId}`), {
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: serverTimestamp()
        });
    },

    async mergeDocument(tenantId: string, stagingId: string, targetDocId: string, finalData: any) {
        // Create a new version of the existing document
        await addDoc(collection(db, `tenants/${tenantId}/document_versions`), {
            documentId: targetDocId,
            data: finalData,
            sourceStagingId: stagingId,
            createdAt: serverTimestamp()
        });

        // Mark staging as committed (merged)
        await updateDoc(doc(db, `tenants/${tenantId}/document_staging/${stagingId}`), {
            status: 'committed',
            mergeTarget: targetDocId
        });
    }
};
