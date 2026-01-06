// src/services/govintel/aggregation-service.ts

import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export interface AggregatedStats {
    totalStudents: number;
    atRiskStudents: number;
    avgAttendance: number;
    casesOpen: number;
    casesResolvedLast30Days: number;
    lastUpdated: string;
}

export class AggregationService {
    
    /**
     * Fetch aggregated stats for a specific hierarchy node (e.g. LEA or Region).
     * If cache is stale, triggers a Cloud Function to re-aggregate.
     */
    static async getStats(nodeId: string, level: 'lea' | 'region' | 'national'): Promise<AggregatedStats | null> {
        const docRef = doc(db, `gov_stats/${nodeId}`);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as AggregatedStats;
            
            // Check staleness (e.g. > 24 hours old)
            const lastUpdate = new Date(data.lastUpdated).getTime();
            const now = new Date().getTime();
            if (now - lastUpdate > 24 * 60 * 60 * 1000) {
                this.triggerAggregation(nodeId, level); // Fire and forget update
            }
            
            return data;
        } else {
            // First time load
            await this.triggerAggregation(nodeId, level);
            return null; // UI shows loading state
        }
    }

    /**
     * Subscribe to real-time updates of aggregated stats.
     */
    static subscribeToStats(nodeId: string, callback: (stats: AggregatedStats | null) => void) {
        return onSnapshot(doc(db, `gov_stats/${nodeId}`), (snap) => {
            if (snap.exists()) {
                callback(snap.data() as AggregatedStats);
            } else {
                callback(null);
            }
        });
    }

    private static async triggerAggregation(nodeId: string, level: string) {
        try {
            const aggregateFn = httpsCallable(functions, 'aggregateGovStatsV2');
            await aggregateFn({ nodeId, level });
        } catch (e) {
            console.error("Aggregation trigger failed", e);
        }
    }
}
