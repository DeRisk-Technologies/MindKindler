import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

/**
 * Government Intelligence: Snapshot Engine
 * Aggregates data from operational collections into anonymous stats.
 */

export interface GovSnapshot {
    id?: string;
    scopeType: 'council' | 'state' | 'federal';
    scopeId: string;
    period: string; // YYYY-MM
    createdAt: string;
    metrics: {
        assessments: { total: number; avgScore: number };
        interventions: { active: number; improving: number; worsening: number };
        safeguarding: { total: number; critical: number; open: number };
        compliance: { findings: number; critical: number };
        training: { completions: number; totalHours: number };
    };
}

export async function generateSnapshot(scopeType: 'council' | 'state' | 'federal', scopeId: string): Promise<GovSnapshot> {
    console.log(`[GovIntel] Generating snapshot for ${scopeType}:${scopeId}`);

    // Mock Fetching (Real app would use Count/Aggregation Queries)
    // We assume the caller or security rules handle tenancy filters
    const assessSnap = await getDocs(collection(db, "assessment_results"));
    const intSnap = await getDocs(collection(db, "interventionPlans"));
    const safeSnap = await getDocs(collection(db, "safeguardingIncidents"));
    const trainSnap = await getDocs(collection(db, "trainingCompletions"));
    const findSnap = await getDocs(collection(db, "guardianFindings"));

    // Aggregation Logic (Mocked Scope Filtering)
    // In production, we'd filter by schoolId matching the council/state hierarchy.
    // Here we aggregate ALL for demo purposes.

    const totalAssessments = assessSnap.size;
    
    // Outcome Logic
    let improving = 0;
    let worsening = 0;
    intSnap.forEach(d => {
        const data = d.data();
        if ((data.currentScore || 0) > (data.baselineScore || 0) + 5) improving++;
        else if ((data.currentScore || 0) < (data.baselineScore || 0) - 5) worsening++;
    });

    const snapshot: GovSnapshot = {
        scopeType,
        scopeId,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        createdAt: new Date().toISOString(),
        metrics: {
            assessments: { 
                total: totalAssessments, 
                avgScore: 0 // Placeholder
            },
            interventions: { 
                active: intSnap.size, 
                improving, 
                worsening 
            },
            safeguarding: { 
                total: safeSnap.size, 
                critical: safeSnap.docs.filter(d => d.data().severity === 'critical').length,
                open: safeSnap.docs.filter(d => d.data().status === 'open').length
            },
            compliance: {
                findings: findSnap.size,
                critical: findSnap.docs.filter(d => d.data().severity === 'critical').length
            },
            training: {
                completions: trainSnap.size,
                totalHours: 0 // Need join with module duration
            }
        }
    };

    // Persist
    await addDoc(collection(db, "govSnapshots"), snapshot);
    
    return snapshot;
}

export function formatMetric(val: number): string {
    if (val < 5) return "—"; // Suppression
    return val.toLocaleString();
}
