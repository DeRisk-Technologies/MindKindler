// functions/src/upload/bulkImport.ts

import { onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface BulkItem {
    fileName: string;
    studentId?: string;
    category: string;
}

export const processBulkManifest = onCall({ 
    region: 'europe-west3',
    cors: true 
}, async (request: CallableRequest<any>) => {
    if (!request.auth) throw new Error("Unauthorized");

    const { tenantId, manifest } = request.data as { tenantId: string, manifest: BulkItem[] };
    const userId = request.auth.uid;

    // 1. Create Job
    const jobRef = await db.collection(`tenants/${tenantId}/assistant_upload_jobs`).add({
        status: 'initializing',
        totalFiles: manifest.length,
        processedFiles: 0,
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        manifest: manifest
    });

    // 2. Validate & Enqueue
    let validCount = 0;
    const errors: any[] = [];

    const batch = db.batch();

    for (let i = 0; i < manifest.length; i++) {
        const item = manifest[i];
        
        if (!item.fileName || !item.category) {
            errors.push({ index: i, error: "Missing required fields" });
            continue;
        }

        const docRef = db.collection(`tenants/${tenantId}/documents`).doc();
        batch.set(docRef, {
            tenantId,
            fileName: item.fileName,
            category: item.category,
            studentId: item.studentId || null,
            uploadedBy: userId,
            status: 'pending_upload', 
            jobId: jobRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        validCount++;
    }

    await batch.commit();

    await jobRef.update({
        status: 'ready_for_upload',
        validFiles: validCount,
        errors
    });

    return { jobId: jobRef.id, validCount, errors };
});
