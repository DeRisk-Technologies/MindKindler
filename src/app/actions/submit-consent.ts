// src/app/actions/submit-consent.ts
"use server";

import { getRegionalDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, arrayUnion } from "firebase/firestore";
import { ExternalRequest } from "@/types/schema";
import { isExpired } from "@/lib/security/magic-links";

export async function submitConsentAction(requestId: string, token: string, data: any, region: string = 'uk') {
    const db = getRegionalDb(region);
    const requestRef = doc(db, 'external_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) throw new Error("Request not found");
    const request = requestSnap.data() as ExternalRequest;
    
    // Security Checks
    if (request.token !== token) throw new Error("Invalid security token");
    if (isExpired(request.expiresAt)) throw new Error("Link has expired");
    if (request.status === 'submitted') throw new Error("Consent already signed");

    const now = new Date().toISOString();

    // 1. Create Consent Record (Permanent Legal Proof)
    // We create multiple records if they agreed to different things, or one consolidated.
    // Schema 'ConsentRecord' is per category.
    
    const consentBatch = [];
    
    // Core Involvement Consent
    consentBatch.push({
        studentId: request.studentId,
        category: 'education_share', // Mapping "Involvement + Sharing" to education_share
        status: 'granted',
        grantedAt: now,
        notes: `Signed by ${data.signedName} (Parental Responsibility Confirmed). Via Portal Request ${requestId}.`
    });

    // Recording Consent
    if (data.agreeRecording) {
        consentBatch.push({
            studentId: request.studentId,
            category: 'media_recording',
            status: 'granted',
            grantedAt: now,
            notes: `Audio recording consent granted by ${data.signedName}.`
        });
    }

    // Save to Firestore
    for (const record of consentBatch) {
        await addDoc(collection(db, 'consents'), {
            ...record,
            tenantId: request.tenantId,
            parentId: request.recipientEmail // loosely link by email
        });
    }

    // 2. Update the Request Status
    await updateDoc(requestRef, {
        status: 'submitted',
        auditLog: {
            ...request.auditLog,
            submittedAt: now,
            signedName: data.signedName
        }
    });

    // 3. Update the Case (Unlock Workflow)
    if (request.caseId) {
        const caseRef = doc(db, 'cases', request.caseId);
        await updateDoc(caseRef, {
            status: 'active', // Unblock case
            activities: arrayUnion({
                date: now,
                summary: `Digital Consent signed by ${data.signedName}`,
                performedBy: 'Parent (Portal)',
                type: 'compliance'
            })
        });
    }

    // 4. (Future) Trigger PDF Generation
    // await generateConsentPdf(request, data);

    return { success: true };
}
