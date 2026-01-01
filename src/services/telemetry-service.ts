// src/services/telemetry-service.ts

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type TelemetryEventName = 
    | 'caseCreated' 
    | 'caseUpdated' 
    | 'taskCompleted' 
    | 'escalation' 
    | 'slaBreached' 
    | 'caseAutoCreated'
    | 'alertLinked';

export interface TelemetryEvent {
    eventName: TelemetryEventName;
    tenantId: string;
    userId?: string;
    metadata?: Record<string, any>;
}

export async function trackEvent(event: TelemetryEvent) {
    try {
        await addDoc(collection(db, "case_telemetry"), {
            ...event,
            timestamp: serverTimestamp(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        });
    } catch (e) {
        console.warn("Failed to log telemetry", e);
    }
}
