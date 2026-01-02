// src/services/student360-service.ts

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Student } from "@/types/schema";
import { AlertData } from "@/components/student360/AlertCard";
import { EvidenceDoc } from "@/components/student360/EvidencePanel";
import { offlineStorage } from "./offline-storage";

interface FetchOptions {
    onlineOnly?: boolean;
}

export async function getStudentProfile(tenantId: string, studentId: string, opts: FetchOptions = {}): Promise<Student | null> {
    const key = `student_${studentId}`;
    
    // 1. Try Cache First if not forcing online
    if (!opts.onlineOnly) {
        const cached = await offlineStorage.getItem<Student>(key);
        if (cached) {
            console.log(`[Cache Hit] Student ${studentId}`);
            // Background revalidation
            fetchAndCacheStudent(tenantId, studentId, key); 
            return cached;
        }
    }

    return await fetchAndCacheStudent(tenantId, studentId, key);
}

async function fetchAndCacheStudent(tenantId: string, studentId: string, key: string) {
    if (!navigator.onLine) return null;
    
    try {
        const ref = doc(db, "students", studentId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as Student;
            await offlineStorage.setItem(key, data);
            return data;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch student", e);
        return null;
    }
}

export async function getStudentAlerts(tenantId: string, studentId: string, opts: FetchOptions = {}): Promise<AlertData[]> {
    const key = `alerts_${studentId}`;
    
    if (!opts.onlineOnly) {
        const cached = await offlineStorage.getItem<AlertData[]>(key);
        if (cached) {
            fetchAndCacheAlerts(tenantId, studentId, key);
            return cached;
        }
    }
    return await fetchAndCacheAlerts(tenantId, studentId, key) || [];
}

async function fetchAndCacheAlerts(tenantId: string, studentId: string, key: string) {
    if (!navigator.onLine) return null;
    // Mock Implementation for Stage 4/6
    const data: AlertData[] = [
        {
            id: 'a1',
            type: 'risk',
            severity: 'critical',
            title: 'Attendance Drop detected',
            description: 'Student has missed 3 consecutive sessions without notice.',
            date: new Date().toISOString(),
            evidence: [
                { sourceId: 'd1', snippet: "Absent from Math (3rd time)", trustScore: 0.95 },
                { sourceId: 'd2', snippet: "Teacher note: Parent unreachable", trustScore: 0.8 }
            ]
        },
        {
            id: 'a2',
            type: 'academic',
            severity: 'medium',
            title: 'Reading score fluctuation',
            description: 'Latest assessment shows divergent scores compared to baseline.',
            date: new Date(Date.now() - 86400000).toISOString(),
            evidence: []
        }
    ];
    await offlineStorage.setItem(key, data);
    return data;
}

export async function getStudentEvidence(tenantId: string, studentId: string, opts: FetchOptions = {}): Promise<EvidenceDoc[]> {
    const key = `evidence_${studentId}`;
    
    if (!opts.onlineOnly) {
        const cached = await offlineStorage.getItem<EvidenceDoc[]>(key);
        if (cached) {
            fetchAndCacheEvidence(tenantId, studentId, key);
            return cached;
        }
    }
    return await fetchAndCacheEvidence(tenantId, studentId, key) || [];
}

async function fetchAndCacheEvidence(tenantId: string, studentId: string, key: string) {
    if (!navigator.onLine) return null;
    // Mock
    const data: EvidenceDoc[] = [
        {
            id: 'e1',
            title: 'Psychological Assessment Report',
            type: 'PDF',
            date: new Date(Date.now() - 100000000).toISOString(),
            trustScore: 0.98
        },
        {
            id: 'e2',
            title: 'Teacher Observation Log (Q1)',
            type: 'Note',
            date: new Date(Date.now() - 50000000).toISOString(),
            trustScore: 0.85
        }
    ];
    await offlineStorage.setItem(key, data);
    return data;
}

// Optimistic Action Handler
export async function performOptimisticAction(actionName: string, payload: any) {
    if (navigator.onLine) {
        // Execute immediately (mocked)
        console.log(`[Online] Executing ${actionName}`);
        return true;
    } else {
        // Queue
        console.log(`[Offline] Queuing ${actionName}`);
        await offlineStorage.queueAction({ type: actionName, payload, id: crypto.randomUUID() });
        return false; // Indicating queued
    }
}
