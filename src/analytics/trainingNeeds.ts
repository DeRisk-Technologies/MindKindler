import { TrainingNeed, OutcomeStats } from "@/types/schema";

/**
 * Training Needs Detection Engine
 * Uses outcome analytics to suggest training.
 */

export function detectTrainingNeeds(stats: OutcomeStats): TrainingNeed[] {
    const needs: TrainingNeed[] = [];

    // Logic 1: Low Completion Rate -> Suggest Engagement Training
    if (stats.completionRate < 50) {
        needs.push({
            category: "Engagement",
            severity: "medium",
            reason: "Low intervention completion rates detected.",
            suggestedModules: [] // Would link to real IDs
        });
    }

    // Logic 2: High Worsening Count -> Suggest Specific Skills
    if (stats.worseningCount > 5) {
        needs.push({
            category: "Complex Cases",
            severity: "high",
            reason: "Multiple cases showing worsening outcomes.",
            suggestedModules: []
        });
    }

    // Logic 3: Baseline (Always suggest foundational if no activity)
    if (stats.totalPlans === 0) {
        needs.push({
            category: "Onboarding",
            severity: "low",
            reason: "No active plans. Staff may need system training.",
            suggestedModules: []
        });
    }

    return needs;
}
