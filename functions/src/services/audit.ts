// functions/src/services/audit.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

export type AuditAction = 
    | 'GENERATE_REPORT'
    | 'PROVISION_DATA'
    | 'SYSTEM_ACTION';

export interface AuditEntry {
    tenantId: string;
    action: AuditAction;
    actorId: string;
    resourceType: string;
    resourceId: string;
    metadata?: any;
}

export const logAuditEvent = async (entry: AuditEntry) => {
    try {
        const db = admin.firestore();
        await db.collection(`tenants/${entry.tenantId}/audit_logs`).add({
            ...entry,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error(`[Audit] Failed to log event for ${entry.tenantId}`, e);
    }
};
