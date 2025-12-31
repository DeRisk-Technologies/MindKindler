// src/govintel/rollout/readiness.ts

import { db } from "@/lib/firebase";
import { getDocs, collection, query, where } from "firebase/firestore";

export interface ReadinessScore {
    totalScore: number;
    breakdown: {
        governance: number;
        training: number;
        data: number;
        operations: number;
        safeguarding: number;
    };
    risks: string[];
    recommendations: string[];
}

export async function computeReadiness(programId: string): Promise<ReadinessScore> {
    // Mock Aggregation (Real logic would query active policies, completions, etc.)
    
    // 1. Governance (Policies Active)
    const policiesSnap = await getDocs(query(collection(db, "policyRules"), where("enabled", "==", true)));
    const governanceScore = Math.min(25, policiesSnap.size * 5);

    // 2. Training (Cohort Completion)
    // Assume 50% for mock
    const trainingScore = 15; 

    // 3. Data (Assessments)
    const assessmentsSnap = await getDocs(collection(db, "assessment_results"));
    const dataScore = Math.min(20, assessmentsSnap.size * 2);

    // 4. Operations (Active Users - Mock)
    const operationsScore = 10;

    // 5. Safeguarding (Incident Closure Rate - Mock)
    const safeguardingScore = 10;

    const totalScore = governanceScore + trainingScore + dataScore + operationsScore + safeguardingScore;

    const risks = [];
    if (governanceScore < 10) risks.push("Governance Framework Incomplete");
    if (trainingScore < 10) risks.push("Low Training Adoption");

    return {
        totalScore,
        breakdown: {
            governance: governanceScore,
            training: trainingScore,
            data: dataScore,
            operations: operationsScore,
            safeguarding: safeguardingScore
        },
        risks,
        recommendations: risks.length > 0 ? ["Review Policy Manager", "Assign more training"] : ["Ready for Go-Live"]
    };
}
