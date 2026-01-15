// src/lib/analytics/insights-dashboard.ts

import { DistrictReport, SystemicAlert } from "../../types/analytics";
import { CaseFile } from "../../types/case";
import { PatternGuardian } from "./pattern-guardian";
import { calculateStatutoryTimeline, isMilestoneOverdue } from "../statutory/timeline-calculator";
import { parseISO } from "date-fns";

/**
 * The Insights Dashboard Aggregator.
 * 
 * Generates the "Big Picture" view for District Admins.
 */
export class InsightsDashboard {
    
    private guardian: PatternGuardian;

    constructor() {
        this.guardian = new PatternGuardian();
    }

    /**
     * Generates a comprehensive report for the District Command Center.
     * 
     * @param cases - The full list of cases in the district/tenant.
     */
    generateDistrictReport(cases: CaseFile[]): DistrictReport {
        
        // 1. Run The Guardian (Pattern Detection)
        // In a real app, this might be cached or run async nightly.
        // We cast broadly here assuming CaseFile has the extended fields from our earlier types
        const alerts = this.guardian.scanForClusters(cases as any);

        // 2. Calculate Top Needs (Prevalence Stats)
        const needsTally: Record<string, number> = {};
        
        cases.forEach(c => {
            // Assume we can infer primary need from flags or tags if not explicit field
            // For now, we tally specific flags
            if (c.flags.isNonVerbal) this.tally(needsTally, 'Complex Communication');
            if (c.flags.safeguardingRisk) this.tally(needsTally, 'Safeguarding');
            
            // In a real DB, we'd look at the 'primaryNeed' field
            // Mocking inference:
            if ((c as any).clinicalTags?.includes('autism')) this.tally(needsTally, 'Autism');
            if ((c as any).clinicalTags?.includes('semh')) this.tally(needsTally, 'SEMH');
        });

        // 3. Breach Projections
        // How many active cases are likely to fail the 20-week deadline?
        let breachCount = 0;
        cases.forEach(c => {
            if (c.status === 'closed' || c.status === 'finalized') return;
            
            const timeline = calculateStatutoryTimeline(parseISO(c.statutoryTimeline.requestDate));
            
            // Logic: If already overdue on Final Plan -> Breach
            if (isMilestoneOverdue(timeline.finalPlanDeadline)) {
                breachCount++;
            } 
            // Logic: If overdue on Draft Plan (Week 16) -> High Risk of Breach
            else if (isMilestoneOverdue(timeline.draftPlanDeadline)) {
                breachCount++;
            }
        });

        return {
            generatedAt: new Date().toISOString(),
            totalActiveCases: cases.filter(c => c.status !== 'closed').length,
            topNeeds: needsTally,
            breachProjections: breachCount,
            activeAlerts: alerts
        };
    }

    private tally(record: Record<string, number>, key: string) {
        if (!record[key]) record[key] = 0;
        record[key]++;
    }
}
