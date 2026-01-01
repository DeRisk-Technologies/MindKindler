// src/services/telemetry-service.ts (Updated)

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type TelemetryEventName = 
    | 'aiDraftRequested' 
    | 'aiDraftSuccess' 
    | 'aiRepairAttempted' 
    | 'reportSigned' 
    | 'exportCreated' 
    | 'shareCreated';

export const TelemetryService = {
    async log(eventName: TelemetryEventName, metadata: Record<string, any>) {
        try {
            await addDoc(collection(db, 'report_telemetry'), {
                event: eventName,
                ...metadata,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error('Telemetry Log Failed', e); // Fail safe
        }
    }
};
