// src/govintel/benchmarking/whatWorks.ts

import { BenchmarkUnit } from "./scorecard";

export interface WhatWorksInsight {
    category: string;
    insight: string;
    impactLevel: 'high' | 'medium';
    correlatedTraining: string[];
}

export function analyzeWhatWorks(units: BenchmarkUnit[]): WhatWorksInsight[] {
    const topUnits = units.filter(u => u.outlierStatus === 'top10');
    
    // Mock Correlation Logic (Deterministic)
    // In real app: analyze interventionPlans linked to these units
    if (topUnits.length > 0) {
        return [
            {
                category: "Early Intervention",
                insight: "Top performing councils prioritize Phonics support in Year 1.",
                impactLevel: "high",
                correlatedTraining: ["Phonics Masterclass"]
            },
            {
                category: "Safeguarding",
                insight: "High compliance scores correlate with 'Trauma Informed' training completion > 80%.",
                impactLevel: "medium",
                correlatedTraining: ["Trauma Informed Care"]
            }
        ];
    }

    return [];
}
