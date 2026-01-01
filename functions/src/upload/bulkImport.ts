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
    // For V1, we assume files are pre-uploaded to a temp bucket path or we upload one by one.
    // Here we assume the manifest is processed after file uploads or drives the upload process.
    // Let's implement the logic where manifest creates placeholders for the UI to fill.
}

export const processBulkManifest = onCall(async (request: CallableRequest<any>) => {
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

    // Limit batch size in production
    const batch = db.batch();

    for (let i = 0; i < manifest.length; i++) {
        const item = manifest[i];
        
        // Simple Validation
        if (!item.fileName || !item.category) {
            errors.push({ index: i, error: "Missing required fields" });
            continue;
        }

        // Create Placeholder Document (Waiting for file upload)
        // The UI will use this ID to upload the binary
        const docRef = db.collection(`tenants/${tenantId}/documents`).doc();
        batch.set(docRef, {
            tenantId,
            fileName: item.fileName,
            category: item.category,
            studentId: item.studentId || null,
            uploadedBy: userId,
            status: 'pending_upload', // UI will flip this to 'uploading'
            jobId: jobRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        validCount++;
    }

    await batch.commit();

    // 3. Update Job
    await jobRef.update({
        status: 'ready_for_upload',
        validFiles: validCount,
        errors
    });

    return { jobId: jobRef.id, validCount, errors };
});
