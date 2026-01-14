// src/app/actions/external-portal.ts
"use server";

import { getRegionalDb } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { generateMagicToken, getExpiryDate } from "@/lib/security/magic-links";
import { ExternalRequest, ExternalRequestType } from "@/types/schema";

export async function createExternalRequest(data: Partial<ExternalRequest>, region: string = 'uk') {
    const db = getRegionalDb(region);
    const token = generateMagicToken();
    
    // Fetch Student Name for Email
    let studentName = "the student";
    if (data.studentId) {
        try {
            const studentSnap = await getDoc(doc(db, 'students', data.studentId));
            if (studentSnap.exists()) {
                const s = studentSnap.data();
                studentName = `${s.identity?.firstName?.value || ''} ${s.identity?.lastName?.value || ''}`.trim();
            }
        } catch (e) {
            console.warn("Failed to fetch student name for email", e);
        }
    }

    const request: Omit<ExternalRequest, 'id'> = {
        tenantId: data.tenantId!,
        studentId: data.studentId!,
        caseId: data.caseId!,
        recipientEmail: data.recipientEmail!,
        recipientRole: data.recipientRole as any,
        type: data.type as ExternalRequestType,
        token,
        expiresAt: getExpiryDate(7),
        status: 'sent',
        consentConfig: data.consentConfig,
        auditLog: {
            sentAt: new Date().toISOString()
        }
    };

    const docRef = await addDoc(collection(db, 'external_requests'), request);
    
    // Create Magic Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/portal/contribute/${docRef.id}?token=${token}`;

    // Queue Email
    await addDoc(collection(db, 'mail_queue'), {
        to: request.recipientEmail,
        templateId: 'consent-request',
        data: {
            studentName,
            link
        },
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    
    console.log(`[External] Request created: ${docRef.id}. Email queued for ${request.recipientEmail}`);
    
    return { success: true, id: docRef.id };
}
