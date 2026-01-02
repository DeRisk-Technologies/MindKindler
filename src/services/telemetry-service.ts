// src/services/telemetry-service.ts (Updated for Upload Portal)

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type UploadTelemetryEvent = 
    | 'upload_started'
    | 'upload_completed'
    | 'extraction_success'
    | 'extraction_failed'
    | 'extraction_repair_attempted'
    | 'staging_item_approved'
    | 'staging_item_rejected'
    | 'document_published'
    | 'dedupe_detected'
    | 'bulk_job_created'
    | 'bulk_job_failed';

export const TelemetryService = {
    async logUploadEvent(eventName: UploadTelemetryEvent, tenantId: string, metadata: Record<string, any>) {
        try {
            await addDoc(collection(db, 'upload_telemetry'), {
                event: eventName,
                tenantId,
                ...metadata,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.warn('Telemetry Log Failed', e); 
        }
    }
};
