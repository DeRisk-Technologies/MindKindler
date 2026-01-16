import { functions } from "@/lib/firebase"; // Import functions instance
import { httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

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

/**
 * Generates (or triggers generation of) a snapshot.
 * In Production, this calls a Cloud Function to perform the heavy lifting.
 */
export async function generateSnapshot(scopeType: 'council' | 'state' | 'federal', scopeId: string): Promise<GovSnapshot> {
    console.log(`[GovIntel] Requesting snapshot for ${scopeType}:${scopeId}`);

    try {
        // 1. Try to fetch existing recent snapshot first (Cache hit)
        const recentQ = query(
            collection(db, "govSnapshots"),
            where("scopeId", "==", scopeId),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const recentSnap = await getDocs(recentQ);
        
        if (!recentSnap.empty) {
            const data = recentSnap.docs[0].data() as GovSnapshot;
            const age = Date.now() - new Date(data.createdAt).getTime();
            if (age < 24 * 60 * 60 * 1000) { // < 24 hours old
                return data;
            }
        }

        // 2. Trigger Cloud Aggregation
        const aggregateFn = httpsCallable(functions, 'aggregateGovStatsV2'); // V2 maps to aggregateGovStats in index.ts
        const result = await aggregateFn({ nodeId: scopeId, level: scopeType === 'council' ? 'lea' : 'region' });
        const stats = (result.data as any).stats;

        // 3. Construct Client Snapshot Object from Cloud Result
        return {
            scopeType,
            scopeId,
            period: new Date().toISOString().slice(0, 7),
            createdAt: new Date().toISOString(),
            metrics: {
                assessments: { total: stats.totalStudents || 0, avgScore: 0 },
                interventions: { active: stats.casesOpen || 0, improving: 0, worsening: 0 },
                safeguarding: { total: stats.atRiskStudents || 0, critical: 0, open: 0 },
                compliance: { findings: 0, critical: 0 },
                training: { completions: 0, totalHours: 0 }
            }
        };

    } catch (error) {
        console.error("Snapshot Generation Failed", error);
        throw error;
    }
}

export function formatMetric(val: number): string {
    if (val < 5 && val > 0) return "< 5"; // Statistical Suppression for Privacy
    return val.toLocaleString();
}
