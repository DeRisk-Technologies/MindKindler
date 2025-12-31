import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Explicitly set region to match the rest of the app
export const processDocumentHandler = onDocumentCreated({
    document: "documents/{docId}",
    region: "europe-west3"
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const docData = snapshot.data();
    const docId = event.params.docId;

    // Only process if status is 'uploading' to avoid loops
    if (docData.status !== 'uploading') return;

    try {
        await snapshot.ref.update({ status: 'processing' });

        // Simulate AI Processing Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock Extraction Logic based on Category
        let extractedData: any = {};
        const confidence = 0.85;

        if (docData.category === 'academic_record') {
            extractedData = {
                subjects: [
                    { name: "Mathematics", grade: "A", score: 92 },
                    { name: "English Language", grade: "B+", score: 88 },
                    { name: "Science", grade: "A-", score: 90 }
                ],
                term: "Fall 2024",
                gpa: 3.8
            };
        } else if (docData.category === 'attendance_log') {
             extractedData = {
                 totalDays: 180,
                 present: 172,
                 absent: 8,
                 tardy: 2,
                 notes: "Good attendance record."
             };
        } else {
             extractedData = {
                 summary: "Document content extracted successfully.",
                 keywords: ["education", "report", "2024"]
             };
        }

        // Store Extracted Data
        const extractionRef = await admin.firestore().collection('extraction_staging').add({
            documentId: docId,
            category: docData.category,
            rawExtraction: extractedData,
            confidenceScore: confidence,
            reviewedBy: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Document Status
        await snapshot.ref.update({ 
            status: 'review_required', // Force human review for prototype safety
            extractedDataRef: extractionRef.id,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Document ${docId} processed successfully.`);

    } catch (error: any) {
        console.error("Error processing document:", error);
        await snapshot.ref.update({ 
            status: 'error', 
            errorMsg: error.message 
        });
    }
});
