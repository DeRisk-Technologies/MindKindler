// src/govintel/rollout/adoption.ts

import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";

export interface AdoptionMetrics {
    activeUsers30d: number;
    assessmentsCompleted30d: number;
    trainingCompletionRate: number;
    complianceFindings: number;
}

export async function getAdoptionMetrics(programId: string): Promise<AdoptionMetrics> {
    const assessmentsSnap = await getDocs(collection(db, "assessment_results"));
    const completionsSnap = await getDocs(collection(db, "trainingCompletions"));
    const findingsSnap = await getDocs(collection(db, "guardianFindings"));

    return {
        activeUsers30d: 15, // Mock
        assessmentsCompleted30d: assessmentsSnap.size,
        trainingCompletionRate: 45, // Mock %
        complianceFindings: findingsSnap.size
    };
}
