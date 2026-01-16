import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

export const generateSecureLink = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    const { caseId, reportId, email, role } = request.data;
    
    // 1. Generate Token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 2. Save to GLOBAL or REGIONAL DB?
    // Magic links are authentication mechanisms, usually global, but point to regional data.
    // We'll store in Global for centralized validation.
    
    await db.collection('feedback_sessions').doc(token).set({
        id: token,
        caseId,
        reportId,
        stakeholderEmail: email,
        stakeholderRole: role,
        createdAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
        accessedAt: null,
        accessCount: 0,
        isRevoked: false,
        createdBy: request.auth.uid
    });

    return { url: `https://mindkindler.app/portal/review?token=${token}` };
});

export const validateSecureLink = onCall(async (request) => {
    // Unauthenticated call allowed (Public Portal)
    const { token } = request.data;
    
    const docRef = db.collection('feedback_sessions').doc(token);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new HttpsError('not-found', 'Invalid token.');
    
    const session = docSnap.data();
    
    if (!session) throw new HttpsError('internal', 'Session data corrupted.');

    if (session.isRevoked) throw new HttpsError('permission-denied', 'Revoked.');
    if (new Date(session.expiresAt) < new Date()) throw new HttpsError('permission-denied', 'Expired.');

    // Audit
    await docRef.update({ 
        accessedAt: new Date().toISOString(),
        accessCount: admin.firestore.FieldValue.increment(1)
    });

    return { session };
});
