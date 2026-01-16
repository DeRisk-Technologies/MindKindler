// src/lib/ai/provision-architect.ts (UPDATED)

import { Finding, ProvisionSpec, NeedCategory } from "../../types/report";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export class ProvisionArchitect {

    async draftProvisionPlan(findings: Finding[]): Promise<ProvisionSpec[]> {
        
        // Group findings first
        const findingsByCategory: Record<string, Finding[]> = {};
        findings.forEach(f => {
            if (!findingsByCategory[f.category]) findingsByCategory[f.category] = [];
            findingsByCategory[f.category].push(f);
        });

        const provisionPlan: ProvisionSpec[] = [];
        const draftFn = httpsCallable(functions, 'draftProvisionPlan');

        // Parallel processing for categories
        const promises = Object.keys(findingsByCategory).map(async (category) => {
            const categoryFindings = findingsByCategory[category];
            try {
                const result = await draftFn({ findings: categoryFindings, category });
                const data = result.data as any;
                
                // Map result to ProvisionSpec
                const specs: ProvisionSpec[] = data.provision.map((p: any, idx: number) => ({
                    id: `prov-${category}-${idx}-${Date.now()}`,
                    areaOfNeed: category as NeedCategory,
                    outcome: p.outcome,
                    provision: p.provision,
                    frequency: p.frequency,
                    staffing: p.staffing,
                    justificationFindingId: 'ai-generated'
                }));
                provisionPlan.push(...specs);
            } catch (e) {
                console.error(`Failed to draft for ${category}`, e);
            }
        });

        await Promise.all(promises);
        return provisionPlan;
    }
}
