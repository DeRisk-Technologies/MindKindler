// src/services/audit/audit-logger.ts

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const AuditLogger = {
    async logDocumentAction(tenantId: string, docId: string, action: string, userId: string, metadata?: any) {
        await addDoc(collection(db, `tenants/${tenantId}/documents/${docId}/timeline`), {
            type: action, // 'upload', 'extract', 'approve', 'reject', 'merge'
            actorId: userId,
            metadata,
            timestamp: serverTimestamp()
        });
    }
};
