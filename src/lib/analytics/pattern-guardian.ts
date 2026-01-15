// src/lib/analytics/pattern-guardian.ts

import { SystemicAlert, AlertSeverity } from "../../types/analytics";
import { CaseFile } from "../../types/case"; // From Phase 45
import { differenceInDays, parseISO } from "date-fns";

/**
 * Extended CaseFile for scanning purposes.
 * (Ideally, the CaseFile interface in Phase 45 would have these fields. 
 *  We cast or extend here for the scanning logic if they were optional).
 */
interface ScannableCase extends CaseFile {
    schoolId?: string;
    postcode?: string; // e.g. "LS2 9JT"
    clinicalTags?: string[]; // e.g. ['anxiety', 'bullying']
    siblingCaseIds?: string[];
    safeguardingRisk?: boolean; // From flags
}

/**
 * The Guardian.
 * 
 * A background service that scans the entire caseload to identify systemic patterns
 * that individual clinicians might miss.
 */
export class PatternGuardian {

    /**
     * Scans the provided list of cases for clusters and hidden risks.
     * 
     * @param activeCases - The full dataset of current cases.
     * @returns A list of generated alerts.
     */
    scanForClusters(activeCases: ScannableCase[]): SystemicAlert[] {
        const alerts: SystemicAlert[] = [];
        const now = new Date().toISOString();

        // 1. School Cluster Scan
        // "Is there an outbreak of bullying/anxiety at a specific school?"
        const casesBySchool = this.groupBy(activeCases, c => c.schoolId || 'unknown');
        
        for (const [schoolId, schoolCases] of Object.entries(casesBySchool)) {
            if (schoolId === 'unknown') continue;

            const recentAnxietyCases = schoolCases.filter(c => 
                this.hasTag(c, ['anxiety', 'bullying', 'self_harm']) && 
                this.isRecent(c.updatedAt, 90)
            );

            if (recentAnxietyCases.length >= 3) {
                alerts.push({
                    id: \`alert-school-\${schoolId}-\${Date.now()}\`,
                    type: 'school_cluster',
                    targetId: schoolId,
                    severity: 'high',
                    description: \`\${recentAnxietyCases.length} students at School \${schoolId} flagged for Anxiety/Bullying in the last 90 days.\`,
                    detectedAt: now,
                    relatedCaseIds: recentAnxietyCases.map(c => c.id),
                    status: 'new'
                });
            }
        }

        // 2. Home Front Scan (Community/Postcode)
        // "Is there a cluster of neglect issues in a specific neighborhood?"
        // Respects Privacy: Aggregates by Sector (e.g. "LS2 9")
        const casesBySector = this.groupBy(activeCases, c => this.getPostcodeSector(c.postcode));
        
        for (const [sector, sectorCases] of Object.entries(casesBySector)) {
            if (sector === 'unknown') continue;

            const neglectCases = sectorCases.filter(c => 
                this.hasTag(c, ['neglect', 'attendance_issue', 'housing_stress'])
            );

            if (neglectCases.length >= 3) {
                alerts.push({
                    id: \`alert-sector-\${sector}-\${Date.now()}\`,
                    type: 'community_cluster',
                    targetId: sector,
                    severity: 'medium',
                    description: \`\${neglectCases.length} cases in Sector \${sector} flagged for Neglect/Housing issues.\`,
                    detectedAt: now,
                    relatedCaseIds: neglectCases.map(c => c.id),
                    status: 'new'
                });
            }
        }

        // 3. Sibling Risk Scan (Recursive/Linked)
        // "If Child A is in danger, is Child B also at risk but currently under the radar?"
        activeCases.forEach(caseA => {
            if (caseA.flags.safeguardingRisk) {
                // Check siblings
                caseA.siblingCaseIds?.forEach(siblingId => {
                    const caseB = activeCases.find(c => c.id === siblingId);
                    
                    // Logic: If sibling exists AND they don't have their own risk flag yet.
                    if (caseB && !caseB.flags.safeguardingRisk) {
                        alerts.push({
                            id: \`alert-sibling-\${caseB.id}\`,
                            type: 'sibling_risk',
                            targetId: caseB.id,
                            severity: 'critical',
                            description: \`Proactive Check Recommended: Sibling (Case \${caseA.id}) has active Safeguarding Risk.\`,
                            detectedAt: now,
                            relatedCaseIds: [caseA.id, caseB.id],
                            status: 'new'
                        });
                    }
                });
            }
        });

        return alerts;
    }

    // --- Helpers ---

    private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
        return array.reduce((acc, item) => {
            const key = keyFn(item);
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {} as Record<string, T[]>);
    }

    private hasTag(c: ScannableCase, tagsToCheck: string[]): boolean {
        return c.clinicalTags?.some(tag => tagsToCheck.includes(tag)) || false;
    }

    private isRecent(dateStr: string, days: number): boolean {
        // Simple heuristic: check if date is within X days
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return differenceInDays(new Date(), date) <= days;
    }

    private getPostcodeSector(postcode?: string): string {
        if (!postcode) return 'unknown';
        // UK Postcode: "LS2 9JT" -> Sector "LS2 9"
        // Heuristic: Take part before last 2 chars
        const trimmed = postcode.trim();
        if (trimmed.length < 5) return 'unknown'; // Invalid
        return trimmed.substring(0, trimmed.length - 2).trim();
    }
}
