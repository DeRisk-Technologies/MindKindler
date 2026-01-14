// src/services/audit/audit-logger.ts

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AuditAction = 
    | 'VIEW_SENSITIVE_RECORD'
    | 'GENERATE_REPORT'
    | 'EXPORT_DOCX'
    | 'UPDATE_CASE'
    | 'UPLOAD_DOCUMENT'
    | 'PROVISION_DATA';

export interface AuditEntry {
    action: AuditAction;
    actorId: string; // User ID
    resourceType: 'student' | 'report' | 'case' | 'file';
    resourceId: string;
    metadata?: Record<string, any>;
}

export const AuditService = {
    async log(tenantId: string, entry: AuditEntry) {
        if (!tenantId) {
            console.warn("Audit Log skipped: No Tenant ID");
            return;
        }
        
        try {
            await addDoc(collection(db, `tenants/${tenantId}/audit_logs`), {
                ...entry,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Audit Log Failed", e);
        }
    },

    // Legacy method support
    async logDocumentAction(tenantId: string, docId: string, action: string, userId: string, metadata?: any) {
        await this.log(tenantId, {
            action: 'UPLOAD_DOCUMENT', // Best mapping
            actorId: userId,
            resourceType: 'file',
            resourceId: docId,
            metadata: { originalAction: action, ...metadata }
        });
    }
};
