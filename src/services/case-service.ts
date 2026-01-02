// src/services/case-service.ts

import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp,
    orderBy 
} from "firebase/firestore";
import { Case, CaseTask, CaseTimelineEvent, CasePriority, CaseStatus } from "@/types/schema";

// --- Types ---

export interface CreateCaseInput {
    tenantId: string;
    type: 'student' | 'school' | 'staff';
    subjectId: string;
    title: string;
    description: string;
    priority: CasePriority;
    assignedTo?: string;
    sourceAlertId?: string;
    evidence?: any[];
    createdBy: string;
    tags?: string[];
}

export interface UpdateCaseInput {
    status?: CaseStatus;
    priority?: CasePriority;
    assignedTo?: string;
    description?: string;
    tags?: string[];
}

// --- Service Functions ---

/**
 * Creates a new case document under tenants/{tenantId}/cases
 */
export async function createCase(input: CreateCaseInput): Promise<string> {
    try {
        const caseData = {
            ...input,
            status: 'triage' as CaseStatus, // Default to triage for new creation flow
            createdAt: new Date().toISOString(), // Use ISO for client consistency
            updatedAt: new Date().toISOString(),
            slaDueAt: calculateSLA(input.priority).toISOString()
        };

        const colRef = collection(db, "tenants", input.tenantId, "cases");
        const docRef = await addDoc(colRef, caseData);

        // Initial Timeline Event
        await addTimelineEvent(input.tenantId, docRef.id, {
            type: 'status_change',
            content: `Case created with status 'Triage'`,
            actorId: input.createdBy,
            metadata: { fromAlert: input.sourceAlertId }
        });

        // Link Alert if applicable
        if (input.sourceAlertId) {
            await linkAlertToCase(input.tenantId, input.sourceAlertId, docRef.id, input.createdBy);
        }

        return docRef.id;
    } catch (e) {
        console.error("Error creating case:", e);
        throw e;
    }
}

/**
 * Updates a case and logs a timeline event
 */
export async function updateCase(
    tenantId: string, 
    caseId: string, 
    patch: UpdateCaseInput, 
    actorId: string
): Promise<void> {
    const caseRef = doc(db, "tenants", tenantId, "cases", caseId);
    
    // Fetch old data for timeline diff context (optional optimization: pass in if known)
    const snap = await getDoc(caseRef);
    const oldData = snap.data() as Case;

    await updateDoc(caseRef, {
        ...patch,
        updatedAt: new Date().toISOString()
    });

    // Timeline Logging logic
    if (patch.status && patch.status !== oldData.status) {
        await addTimelineEvent(tenantId, caseId, {
            type: 'status_change',
            content: `Status changed from ${oldData.status} to ${patch.status}`,
            actorId,
            metadata: { old: oldData.status, new: patch.status }
        });
    }

    if (patch.assignedTo && patch.assignedTo !== oldData.assignedTo) {
        await addTimelineEvent(tenantId, caseId, {
            type: 'assignment_change',
            content: `Assigned to user ${patch.assignedTo}`,
            actorId,
            metadata: { old: oldData.assignedTo, new: patch.assignedTo }
        });
    }
}

export async function addTask(tenantId: string, caseId: string, task: Omit<CaseTask, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(db, "tenants", tenantId, "cases", caseId, "tasks");
    const docRef = await addDoc(colRef, {
        ...task,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
}

export async function addTimelineEvent(
    tenantId: string, 
    caseId: string, 
    event: Omit<CaseTimelineEvent, 'id' | 'createdAt'>
): Promise<string> {
    const colRef = collection(db, "tenants", tenantId, "cases", caseId, "timeline");
    const docRef = await addDoc(colRef, {
        ...event,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
}

export async function getCase(tenantId: string, caseId: string): Promise<Case | null> {
    const ref = doc(db, "tenants", tenantId, "cases", caseId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Case;
    return null;
}

export async function listCases(tenantId: string, status?: CaseStatus, assignedTo?: string): Promise<Case[]> {
    let q = query(collection(db, "tenants", tenantId, "cases"), orderBy("updatedAt", "desc"));
    
    if (status) {
        q = query(q, where("status", "==", status));
    }
    if (assignedTo) {
        q = query(q, where("assignedTo", "==", assignedTo));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

// Internal Helper
async function linkAlertToCase(tenantId: string, alertId: string, caseId: string, actorId: string) {
    // In real implementation: update alert document status
    // const alertRef = doc(db, "tenants", tenantId, "alerts", alertId);
    // await updateDoc(alertRef, { status: 'triaged', caseId });
    
    // Log provenance
    const provRef = collection(db, "ai_provenance");
    await addDoc(provRef, {
        tenantId,
        type: 'alert_escalation',
        alertId,
        caseId,
        actorId,
        createdAt: serverTimestamp()
    });
}

function calculateSLA(priority: CasePriority): Date {
    const now = new Date();
    switch (priority) {
        case 'Critical': return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
        case 'High': return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h
        case 'Medium': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7d
        case 'Low': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30d
        default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
}
