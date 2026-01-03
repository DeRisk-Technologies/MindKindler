import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from '../audit/audit-logger';

// Placeholder for Google Document AI Client
// const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

interface ProcessDocumentRequest {
    fileRef: string; // gs://path/to/file
    mimeType: string;
    studentId?: string;
}

export const processDocument = onCall(async (request: CallableRequest<ProcessDocumentRequest>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { fileRef, mimeType } = request.data;
    const uid = request.auth.uid;
    const tenantId = request.auth.token.tenantId || 'default';

    // 1. Log Start
    await logAuditEvent({
        tenantId,
        action: 'ai_generate',
        resourceType: 'document',
        resourceId: fileRef,
        actorId: uid,
        details: 'Started Document AI Processing'
    });

    try {
        // 2. Call Document AI (Mocked for now as we don't have GCP credentials in this env)
        // const client = new DocumentProcessorServiceClient();
        // const [result] = await client.processDocument({ ... });
        
        console.log(`[OCR] Processing ${fileRef} (${mimeType})`);
        
        // Simulate Processing Delay
        await new Promise(r => setTimeout(r, 1500));

        // 3. Mock Extraction Results based on filename
        const isBirthCert = fileRef.toLowerCase().includes('birth');
        const extractedFields = [];

        if (isBirthCert) {
            extractedFields.push({
                key: 'identity.firstName',
                value: 'John',
                confidence: 0.98
            });
            extractedFields.push({
                key: 'identity.dateOfBirth',
                value: '2015-05-20',
                confidence: 0.99
            });
        }

        // 4. Save to Staging in Firestore
        const stagingRef = admin.firestore().collection('document_staging').doc();
        await stagingRef.set({
            tenantId,
            fileRef,
            status: 'ready_for_review',
            extractedData: extractedFields.reduce((acc: any, curr) => {
                acc[curr.key] = curr;
                return acc;
            }, {}),
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, stagingId: stagingRef.id };

    } catch (error: any) {
        console.error("OCR Failed", error);
        await logAuditEvent({
            tenantId,
            action: 'ai_generate',
            resourceType: 'document',
            resourceId: fileRef,
            actorId: uid,
            details: `OCR Failed: ${error.message}`
        });
        throw new HttpsError('internal', 'Document processing failed.');
    }
});
