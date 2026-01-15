// src/lib/security/link-manager.ts

import { randomBytes } from 'crypto';
import { addDays, isAfter, parseISO } from 'date-fns';
import { FeedbackSession } from '../../types/feedback';

// Mock DB interface for this phase
interface DB {
    sessions: Map<string, FeedbackSession>;
}
const MOCK_DB: DB = { sessions: new Map() };

/**
 * Manages the lifecycle of Secure "Magic Links" for external stakeholders.
 */
export class LinkManager {
    
    private readonly BASE_URL = 'https://mindkindler.app/portal/review';
    private readonly DEFAULT_EXPIRY_DAYS = 7;

    /**
     * Generates a new secure access link for a stakeholder.
     * 
     * @param caseId - The Case ID.
     * @param reportId - The specific Draft Report ID to share.
     * @param email - The recipient's email.
     * @param role - The recipient's role (e.g. 'parent').
     */
    async generateReviewLink(
        caseId: string, 
        reportId: string, 
        email: string, 
        role: string
    ): Promise<string> {
        
        // 1. Generate High-Entropy Token (32 bytes = 64 hex chars)
        const token = randomBytes(32).toString('hex');
        
        // 2. Create Session Record
        const now = new Date();
        const session: FeedbackSession = {
            id: token,
            caseId,
            reportId,
            stakeholderEmail: email,
            stakeholderRole: role,
            createdAt: now.toISOString(),
            expiresAt: addDays(now, this.DEFAULT_EXPIRY_DAYS).toISOString(),
            accessedAt: null,
            accessCount: 0,
            isRevoked: false
        };

        // 3. Save to DB (Firestore in real app)
        // await firestore.collection('feedback_sessions').doc(token).set(session);
        MOCK_DB.sessions.set(token, session);
        
        console.log(`[LinkManager] Generated link for ${email}: ${token.substring(0, 8)}...`);

        // 4. Return Full URL
        return `${this.BASE_URL}?token=${token}`;
    }

    /**
     * Validates a token when a user clicks a link.
     * 
     * @param token - The token from the URL query param.
     * @returns The session object if valid.
     * @throws Error if invalid or expired.
     */
    async validateSession(token: string): Promise<FeedbackSession> {
        
        // 1. Lookup Token
        // const doc = await firestore.collection('feedback_sessions').doc(token).get();
        const session = MOCK_DB.sessions.get(token);

        if (!session) {
            throw new Error('Invalid or missing session token.');
        }

        // 2. Check Revocation
        if (session.isRevoked) {
            throw new Error('This link has been revoked by the sender.');
        }

        // 3. Check Expiry
        const now = new Date();
        const expiry = parseISO(session.expiresAt);
        
        if (isAfter(now, expiry)) {
            throw new Error('This link has expired. Please request a new one.');
        }

        // 4. Update Audit Log (Side Effect)
        // In real app: firestore.update({ accessedAt: now, accessCount: increment(1) });
        session.accessedAt = now.toISOString();
        session.accessCount++;
        
        return session;
    }

    /**
     * Immediately invalidates a link (e.g. sent to wrong email).
     */
    async revokeSession(token: string): Promise<void> {
        const session = MOCK_DB.sessions.get(token);
        if (session) {
            session.isRevoked = true;
        }
    }
}
