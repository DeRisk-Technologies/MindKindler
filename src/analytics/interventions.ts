import { InterventionPlan, RecommendationTemplate } from "@/types/schema";

/**
 * Analytics Engine: Intervention Outcomes
 * Aggregates client-side data for small-scale analysis (Phase 3D).
 */

export interface OutcomeStats {
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    improvingCount: number;
    stableCount: number;
    worseningCount: number;
    avgScoreGain: number;
    completionRate: number;
}

export interface InterventionImpact {
    recommendationId: string;
    title: string;
    usageCount: number;
    avgScoreDelta: number;
}

export function calculateOutcomeStats(plans: InterventionPlan[]): OutcomeStats {
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.status === 'active').length;
    const completedPlans = plans.filter(p => p.status === 'completed').length;

    let improvingCount = 0;
    let stableCount = 0;
    let worseningCount = 0;
    let totalScoreGain = 0;
    let scoredPlansCount = 0;

    plans.forEach(p => {
        if (p.baselineScore !== undefined && p.currentScore !== undefined) {
            const delta = p.currentScore - p.baselineScore;
            totalScoreGain += delta;
            scoredPlansCount++;

            if (delta > 5) improvingCount++; // Threshold 5
            else if (delta < -5) worseningCount++;
            else stableCount++;
        }
    });

    return {
        totalPlans,
        activePlans,
        completedPlans,
        improvingCount,
        stableCount,
        worseningCount,
        avgScoreGain: scoredPlansCount > 0 ? totalScoreGain / scoredPlansCount : 0,
        completionRate: totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0
    };
}

export function getTopInterventions(plans: InterventionPlan[]): InterventionImpact[] {
    const impactMap = new Map<string, { title: string, totalDelta: number, count: number }>();

    plans.forEach(plan => {
        if (plan.baselineScore === undefined || plan.currentScore === undefined) return;
        const planDelta = plan.currentScore - plan.baselineScore;

        plan.recommendations.forEach(rec => {
            if (!rec.recommendationId) return; // Skip custom ones
            
            const existing = impactMap.get(rec.recommendationId) || { title: rec.title, totalDelta: 0, count: 0 };
            impactMap.set(rec.recommendationId, {
                title: rec.title,
                totalDelta: existing.totalDelta + planDelta,
                count: existing.count + 1
            });
        });
    });

    const results: InterventionImpact[] = [];
    impactMap.forEach((val, key) => {
        results.push({
            recommendationId: key,
            title: val.title,
            usageCount: val.count,
            avgScoreDelta: val.totalDelta / val.count
        });
    });

    return results.sort((a, b) => b.avgScoreDelta - a.avgScoreDelta).slice(0, 10);
}
