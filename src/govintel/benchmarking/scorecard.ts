// src/govintel/benchmarking/scorecard.ts

import { db } from "@/lib/firebase";
import { getDocs, collection, query, where } from "firebase/firestore";
import { GovSnapshot } from "@/analytics/govSnapshots";

export interface BenchmarkUnit {
    unitId: string;
    unitName: string;
    scores: {
        overall: number;
        outcomes: number;
        safeguarding: number;
        compliance: number;
        training: number;
        capacity: number;
    };
    rawMetrics: any;
    suppressed: string[];
    outlierStatus: 'top10' | 'bottom10' | 'normal';
}

export interface BenchmarkSnapshot {
    id?: string;
    period: string;
    scopeType: 'councilComparison' | 'stateComparison';
    parentScopeId: string;
    units: BenchmarkUnit[];
    createdAt: string;
}

export async function generateBenchmark(scopeType: 'councilComparison' | 'stateComparison', parentScopeId: string): Promise<BenchmarkSnapshot> {
    // 1. Fetch relevant snapshots (Mock: Fetch all govSnapshots)
    // In production: Filter by parentScopeId
    const snapQuery = query(collection(db, "govSnapshots"));
    const snapDocs = await getDocs(snapQuery);
    
    // Group by unit (council/state) - Assuming govSnapshot.scopeId is the unit ID
    // For mock, we treat each existing snapshot as a unique unit
    const units: BenchmarkUnit[] = [];

    snapDocs.forEach(d => {
        const snap = d.data() as GovSnapshot;
        if (snap.scopeType === (scopeType === 'councilComparison' ? 'council' : 'state')) {
            const metrics = snap.metrics;
            
            // Normalize Scores (0-100)
            // Outcomes: High improvement is good
            const outcomeScore = Math.min(100, (metrics.interventions.improving / (metrics.interventions.active || 1)) * 100);
            
            // Safeguarding: Low critical incidents is good (inverse)
            const safeScore = Math.max(0, 100 - (metrics.safeguarding.critical * 10));

            // Compliance: Low findings is good
            const compScore = Math.max(0, 100 - (metrics.compliance.findings * 5));

            // Training: High completions is good
            const trainScore = Math.min(100, metrics.training.completions * 2);

            // Capacity: Mock constant for now
            const capScore = 70;

            // Weighted Overall
            const overall = (outcomeScore * 0.35) + (safeScore * 0.2) + (compScore * 0.15) + (trainScore * 0.2) + (capScore * 0.1);

            // Suppression Check
            const suppressed = [];
            if (metrics.safeguarding.critical < 5) suppressed.push('safeguarding');
            if (metrics.interventions.active < 5) suppressed.push('outcomes');

            units.push({
                unitId: snap.scopeId,
                unitName: `Unit ${snap.scopeId.substring(0,4)}`, // Mock name
                scores: {
                    overall: Math.round(overall),
                    outcomes: Math.round(outcomeScore),
                    safeguarding: Math.round(safeScore),
                    compliance: Math.round(compScore),
                    training: Math.round(trainScore),
                    capacity: capScore
                },
                rawMetrics: metrics,
                suppressed,
                outlierStatus: 'normal'
            });
        }
    });

    // Outlier Detection (Simple Percentile)
    units.sort((a, b) => b.scores.overall - a.scores.overall);
    if (units.length > 2) {
        units[0].outlierStatus = 'top10';
        units[units.length - 1].outlierStatus = 'bottom10';
    }

    return {
        period: new Date().toISOString().slice(0, 7),
        scopeType,
        parentScopeId,
        units,
        createdAt: new Date().toISOString()
    };
}
