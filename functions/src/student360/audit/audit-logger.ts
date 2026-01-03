import * as admin from 'firebase-admin';

// Re-using the AuditEntry interface from schema but adapted for server-side
export interface AuditEntry {
    tenantId: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'ai_generate' | 'login' | 'view_sensitive';
    resourceType: 'student' | 'report' | 'case' | 'document';
    resourceId: string;
    actorId: string; // User ID
    details: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

const AUDIT_COLLECTION = 'audit_logs';

/**
 * Server-side audit logger.
 * Must be used for all critical actions.
 */
export async function logAuditEvent(entry: AuditEntry) {
    try {
        await admin.firestore().collection(AUDIT_COLLECTION).add({
            ...entry,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[AUDIT] ${entry.action} on ${entry.resourceType}:${entry.resourceId} by ${entry.actorId}`);
    } catch (error) {
        console.error("CRITICAL: Failed to write audit log", error);
        // In highly regulated environments, we might want to throw here to block the action
        // if the audit trail fails.
    }
}
