// functions/src/reports/exportReport.ts
import { CallableRequest, onCall } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";

// Initialize pdfMake
// Workaround for type mismatch in pdfmake vfs import
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

export const exportReport = onCall({ 
    region: 'europe-west3',
    cors: true 
}, async (request: CallableRequest<any>) => {
    if (!request.auth) throw new Error('unauthenticated');

    const { tenantId, reportId, redactionLevel, format } = request.data;
    
    // 1. Fetch Report
    const reportSnap = await db.doc(`reports/${reportId}`).get(); 
    if (!reportSnap.exists) throw new Error('Report not found');
    
    const reportData = reportSnap.data();
    
    // 2. Apply Redaction
    const sections = reportData?.content?.sections || [];
    const visibleSections = redactionLevel === 'parent' 
        ? sections.filter((s: any) => !s.internalOnly)
        : sections;

    // 3. Generate PDF (Real Logic)
    const docDefinition: TDocumentDefinitions = {
        content: [
            { text: reportData?.title || 'Clinical Report', style: 'header' },
            { text: `Redaction Level: ${redactionLevel}`, style: 'subheader' },
            { text: `Date: ${new Date().toLocaleDateString()}`, margin: [0, 0, 0, 20] },
            
            ...visibleSections.map((s: any) => [
                { text: s.title, style: 'sectionHeader' },
                { text: s.content, margin: [0, 5, 0, 15] }
            ])
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 14, italics: true, margin: [0, 0, 0, 5] },
            sectionHeader: { fontSize: 12, bold: true, decoration: 'underline' }
        }
    };

    // Render to Buffer
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.getBuffer((buffer: any) => resolve(buffer));
    });
    
    // 4. Upload to Storage
    const bucket = storage.bucket();
    const filePath = `exports/${tenantId}/${reportId}/${Date.now()}_${redactionLevel}.${format}`;
    const file = bucket.file(filePath);
    
    await file.save(pdfBuffer, {
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
