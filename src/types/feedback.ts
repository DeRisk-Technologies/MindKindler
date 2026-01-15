// src/types/feedback.ts

export type FeedbackStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

/**
 * Represents a secure, time-limited window for a Stakeholder (Parent/Professional)
 * to view and comment on a Draft EHC Plan.
 */
export interface FeedbackSession {
    /** 
     * The cryptographically secure token that acts as the ID.
     * This IS the secret key in the URL.
     */
    id: string; 
    
    caseId: string;
    reportId: string; // Links to specific Draft Report
    
    /** Who is this link for? */
    stakeholderEmail: string;
    stakeholderRole: string; // e.g. 'parent', 'senco'
    
    /** Security constraints */
    createdAt: string; // ISO Date
    expiresAt: string; // ISO Date
    
    /** Audit: Has this link been used? */
    accessedAt: string | null; // ISO Date of first access
    accessCount: number;
    
    /** Is the session active? */
    isRevoked: boolean;
}

/**
 * A specific comment or requested change made by the stakeholder via the portal.
 */
export interface DraftComment {
    id: string;
    
    /** Links back to the session (Who said it) */
    sessionId: string;
    stakeholderEmail: string; // Denormalized for easy display
    
    /** Where in the document is this? */
    targetSection: string; // e.g. 'section_b', 'section_f'
    targetParagraphIndex?: number; // Optional granular location
    
    /** What text are they talking about? */
    originalText: string; 
    
    /** What is their feedback? */
    commentText: string;
    
    /** Current status in the moderation queue */
    status: FeedbackStatus;
    
    /** 
     * If accepted/modified, what is the final text that went into the report?
     * Populated by the EPP during resolution.
     */
    resolutionText?: string;
    
    /** Internal note by the EPP explaining the decision */
    resolutionNote?: string;
    
    createdAt: string;
    resolvedAt?: string;
}
