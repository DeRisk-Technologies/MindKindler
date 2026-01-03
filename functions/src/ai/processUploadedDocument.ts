// functions/src/ai/processUploadedDocument.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { runExtraction } from "./flows/extractDocumentFlow";
import { indexDocumentChunk } from "./knowledge/indexDocument";

// Document AI Client
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
// TODO: Replace with your actual Processor ID from Google Cloud Console -> Document AI
const PROCESSOR_ID = process.env.DOCAI_PROCESSOR_ID || "YOUR_PROCESSOR_ID"; 
const LOCATION = "eu"; // Document AI location (eu or us)

async function performOCR(storagePath: string, mimeType: string): Promise<string> {
    const client = new DocumentProcessorServiceClient();
    const name = `projects/${process.env.GCLOUD_PROJECT}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

    // Download file from Storage
    const bucket = admin.storage().bucket();
    const [fileBuffer] = await bucket.file(storagePath).download();
    const content = fileBuffer.toString('base64');

    const request = {
        name,
        rawDocument: {
            content,
            mimeType,
        },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;
    return document.text || "";
}

export const processDocumentHandler = onDocumentCreated({
    document: "tenants/{tenantId}/documents/{docId}",
    region: "europe-west3",
    memory: "1GiB", // OCR needs memory
    timeoutSeconds: 300
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const docData = snapshot.data();
    const { tenantId, docId } = event.params;

    if (docData.status !== 'uploading') return;

    try {
        await snapshot.ref.update({ status: 'processing' });

        // 1. OCR (Real)
        let text = "";
        try {
            if (!process.env.DOCAI_PROCESSOR_ID) {
                console.warn("Missing DOCAI_PROCESSOR_ID, falling back to Mock Text for Dev");
                text = "Mock Text: OCR processor not configured. Please set env var.";
            } else {
                text = await performOCR(docData.storagePath, docData.mimeType);
            }
        } catch (ocrErr) {
            console.error("OCR Failed", ocrErr);
            throw new Error("OCR Processing failed");
        }

        // 2. Fetch Glossary
        const glossarySnap = await db.doc(`tenants/${tenantId}/settings/glossary`).get();
        const glossary = glossarySnap.exists ? glossarySnap.data()?.entries : {};

        // 3. Run AI Extraction (Real)
        const result = await runExtraction(
            tenantId,
            text,
            docData.category,
            glossary,
            docData.uploadedBy
        );

        // 4. Index for RAG (New Step)
        // Split text into chunks (naive split for V1)
        const chunks = text.match(/.{1,1000}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
            await indexDocumentChunk(tenantId, docId, chunks[i], {
                page: i + 1, // Approximation
                sourceType: 'uploaded_doc',
                category: docData.category
            });
        }

        // 5. Create Staging Record
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

        // 6. Update Document Status
        await snapshot.ref.update({
            status: 'review_required',
            processing: {
                stagingId: stagingRef.id,
                attemptCount: 1,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

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
