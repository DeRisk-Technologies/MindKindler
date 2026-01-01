// functions/src/reports/exportReport.ts
import { CallableRequest, onCall } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

export const exportReport = onCall(async (request: CallableRequest<any>) => {
    if (!request.auth) throw new Error('unauthenticated');

    const { tenantId, reportId, redactionLevel, format } = request.data;
    
    // 1. Fetch Report
    const reportSnap = await db.doc(`reports/${reportId}`).get(); // In real app: tenants/{tid}/reports
    if (!reportSnap.exists) throw new Error('Report not found');
    
    const reportData = reportSnap.data();
    
    // 2. Apply Redaction (Mock logic)
    let content = reportData?.content || {};
    if (redactionLevel === 'parent') {
        // Simple mock redaction: Replace any text wrapped in [[redact]]...[[/redact]] or similar tags
        // For V1, let's assume specific sections are marked 'internal' in the JSON structure
        if (content.sections) {
            content.sections = content.sections.filter((s: any) => !s.internalOnly);
        }
    }

    // 3. Generate PDF (Mock)
    // In production, use 'pdfmake' or 'puppeteer' to render `content` to Buffer.
    const mockPdfBuffer = Buffer.from(`Report ID: ${reportId}\nRedaction: ${redactionLevel}\n\n${JSON.stringify(content)}`);
    
    // 4. Upload to Storage
    const bucket = storage.bucket();
    const filePath = `exports/${tenantId}/${reportId}/${Date.now()}_${redactionLevel}.${format}`;
    const file = bucket.file(filePath);
    
    await file.save(mockPdfBuffer, {
        metadata: { contentType: 'application/pdf' }
    });

    // 5. Generate Signed URL
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 mins
    });

    // 6. Log Export
    await db.collection(`reports_exports`).add({
        tenantId,
        reportId,
        requestedBy: request.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        path: filePath,
        redactionLevel
    });

    return { downloadUrl: url, exportId: filePath };
});
