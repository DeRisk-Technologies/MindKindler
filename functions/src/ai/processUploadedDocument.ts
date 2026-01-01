// functions/src/ai/processUploadedDocument.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { runExtraction } from "./flows/extractDocumentFlow";

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Mock OCR function (Replace with Vision API / Document AI in production)
async function performOCR(storagePath: string): Promise<string> {
    // In real app: download file, send to Google Document AI
    return `
    REPORT CARD - FALL 2024
    Student: John Doe
    Math: A (95)
    Science: B+ (88)
    Attendance: 95%
    `;
}

export const processDocumentHandler = onDocumentCreated({
    document: "tenants/{tenantId}/documents/{docId}",
    region: "europe-west3",
    memory: "512MiB"
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const docData = snapshot.data();
    const { tenantId, docId } = event.params;

    // Idempotency check: Only process 'uploading'
    if (docData.status !== 'uploading') return;

    try {
        await snapshot.ref.update({ status: 'processing' });

        // 1. OCR / Text Extraction
        const text = await performOCR(docData.storagePath);

        // 2. Fetch Glossary
        // Optimized: Could cache this
        const glossarySnap = await db.doc(`tenants/${tenantId}/settings/glossary`).get();
        const glossary = glossarySnap.exists ? glossarySnap.data()?.entries : {};

        // 3. Run AI Extraction
        const result = await runExtraction(
            tenantId,
            text,
            docData.category,
            glossary,
            docData.uploadedBy
        );

        // 4. Create Staging Record
        const stagingRef = await db.collection(`tenants/${tenantId}/document_staging`).add({
            documentId: docId,
            status: 'review_required',
            aiResult: {
                data: result.data,
                confidence: result.confidence,
                provenanceId: result.provenanceId
            },
            ocrText: text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedBy: null
        });

        // 5. Update Document Status
        await snapshot.ref.update({
            status: 'review_required',
            processing: {
                stagingId: stagingRef.id,
                attemptCount: 1,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        console.log(`[ProcessDocument] Success: ${docId} -> Staging: ${stagingRef.id}`);

    } catch (error: any) {
        console.error(`[ProcessDocument] Error: ${docId}`, error);
        await snapshot.ref.update({
            status: 'error',
            processing: {
                lastError: error.message,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });
    }
});
