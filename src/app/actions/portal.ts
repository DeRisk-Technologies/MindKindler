// src/app/actions/portal.ts
"use server";

import { getRegionalDb } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { generateMagicToken, getExpiryDate, isExpired } from "@/lib/security/magic-links";
import { ContributionType, ContributionRequest, ContributionSubmission } from "@/types/schema";
import { timingSafeEqual } from "crypto";

// --- Actions ---

export async function createContributionRequest(
    tenantId: string,
    studentId: string, 
    studentName: string,
    recipientEmail: string, 
    recipientRole: 'Parent' | 'SENCO' | 'Teacher',
    type: ContributionType | 'consent_request', // Expanded type
    userId: string,
    region: string = 'uk'
) {
    const db = getRegionalDb(region);
    const token = generateMagicToken();
    const expiresAt = getExpiryDate(7);

    // Create the secure record
    const requestData: Omit<ContributionRequest, 'id'> = {
        tenantId,
        studentId,
        studentName,
        recipientEmail,
        recipientRole,
        type: type as ContributionType,
        token, // Stored to verify later
        expiresAt,
        status: 'sent',
        createdAt: new Date().toISOString(),
        createdBy: userId
    };

    const docRef = await addDoc(collection(db, 'contribution_requests'), requestData);
    
    // Construct Magic Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // For consent, we might want a different path, e.g. /portal/consent/[id]
    // But for now, let's stick to generic /portal/contribute unless we build a dedicated consent page
    const pagePath = type === 'consent_request' ? 'consent' : 'contribute';
    const link = `${baseUrl}/portal/${pagePath}/${docRef.id}?token=${token}`;
    
    // Queue Email Notification
    let templateId = 'magic-link-parent';
    if (type === 'school_advice') templateId = 'magic-link-school';
    if (type === 'consent_request') templateId = 'consent-request';
    
    await addDoc(collection(db, 'mail_queue'), {
        to: recipientEmail,
        templateId,
        data: {
            studentName,
            link
        },
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    
    console.log(`[Portal] Magic Link Generated & Queued for ${recipientEmail}`);
    
    return { success: true, requestId: docRef.id, link };
}

export async function verifyPortalToken(requestId: string, token: string, region: string = 'uk') {
    const db = getRegionalDb(region);
    const ref = doc(db, 'contribution_requests', requestId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { valid: false, error: 'Request not found' };

    const data = snap.data() as ContributionRequest;
    
    // 1. Verify Token (Constant-Time Comparison)
    // We expect both tokens to be 64-char hex strings (32 bytes).
    if (!token || token.length !== data.token.length) {
         return { valid: false, error: 'Invalid token' };
    }
    
    const bufferA = Buffer.from(data.token);
    const bufferB = Buffer.from(token);
    
    if (!timingSafeEqual(bufferA, bufferB)) {
        return { valid: false, error: 'Invalid token' };
    }

    // 2. Check Expiry
    if (isExpired(data.expiresAt)) return { valid: false, error: 'Link expired' };

    // 3. Check Status
    if (data.status === 'submitted') return { valid: false, error: 'Already submitted' };

    // Mark as opened if first time
    if (data.status === 'sent') {
        await updateDoc(ref, { status: 'opened' });
    }

    return { valid: true, data };
}

export async function submitContribution(
    requestId: string, 
    token: string, 
    submissionData: any, 
    region: string = 'uk'
) {
    const verification = await verifyPortalToken(requestId, token, region);
    if (!verification.valid || !verification.data) {
        throw new Error(verification.error || "Invalid request");
    }

    const request = verification.data;
    const db = getRegionalDb(region);

    // 1. Save Submission
    // If it is consent, we might want to update the student record directly too?
    // For now, save submission audit trail.
    
    const submission: Omit<ContributionSubmission, 'id'> = {
        requestId,
        studentId: request.studentId,
        submittedAt: new Date().toISOString(),
        data: submissionData
    };

    await addDoc(collection(db, 'contribution_submissions'), submission);

    // 2. Update Request Status
    await updateDoc(doc(db, 'contribution_requests', requestId), {
        status: 'submitted'
    });
    
    // 3. If Consent, Update Student Record
    if (request.type === ('consent_request' as any) && submissionData.granted) {
         const studentRef = doc(db, 'students', request.studentId);
         // Update consent block on student
         await updateDoc(studentRef, {
             'consent.status': 'granted',
             'consent.grantedAt': new Date().toISOString(),
             'consent.evidenceId': requestId
         });
    }

    // 3. Trigger Triangulation / Notification
    console.log(`[Portal] Submission received for ${request.studentId}.`);

    return { success: true };
}
