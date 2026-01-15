// src/lib/ai/provision-architect.ts

import { Finding, ProvisionSpec, NeedCategory } from "../../types/report";

/**
 * The Provision Architect.
 * 
 * Responsibility:
 * Generates the "Section F" Provision Map.
 * It translates a list of Needs (Findings) into a list of Supports (Provisions).
 * 
 * It strictly adheres to the "Noddy Guide" legal standard:
 * - Provision must be SPECIFIC (what, how often, how long).
 * - Provision must be QUANTIFIED (hours/minutes).
 */
export class ProvisionArchitect {

    /**
     * Drafts a legal provision plan based on clinical findings.
     * 
     * @param findings - The list of identified needs.
     */
    async draftProvisionPlan(findings: Finding[]): Promise<ProvisionSpec[]> {
        
        // 1. Group Findings by Broad Area of Need
        // The LLM works better if we feed it one "Area" at a time.
        const findingsByCategory: Record<string, Finding[]> = {};
        findings.forEach(f => {
            if (!findingsByCategory[f.category]) findingsByCategory[f.category] = [];
            findingsByCategory[f.category].push(f);
        });

        const provisionPlan: ProvisionSpec[] = [];

        // 2. Iterate and Generate
        for (const category in findingsByCategory) {
            const categoryFindings = findingsByCategory[category];
            
            // Construct Prompt
            const prompt = `
You are a UK SEN Legal Expert drafting Section F of an EHCP.
Based on the following Needs (Findings) in the area of "${category}", generate Specific & Quantified provisions.

Needs:
${categoryFindings.map(f => `- ${f.text}`).join('\n')}

Output Format (STRICT JSON Array):
[
  {
    "outcome": "By the end of KS2, the child will...",
    "provision": "1:1 intervention using the 'Toe by Toe' phonics scheme",
    "frequency": "3x 20 mins per week",
    "staffing": "Trained Teaching Assistant (TA)"
  }
]
`;
            
            // TODO: Call Vertex AI here.
            // const aiResponse = await vertex.generate(prompt);

            // MOCK Response for Phase 48
            const mockSpecs = this.mockProvisionGeneration(category as NeedCategory, categoryFindings);
            provisionPlan.push(...mockSpecs);
        }

        return provisionPlan;
    }

    /**
     * MOCK Logic to simulate the "Specific & Quantified" output of the AI.
     */
    private mockProvisionGeneration(category: NeedCategory, findings: Finding[]): ProvisionSpec[] {
        const specs: ProvisionSpec[] = [];

        findings.forEach((finding, index) => {
            // Simple heuristic to generate varied provisions based on keywords
            if (category === 'cognition_learning' && finding.text.includes('Reading')) {
                specs.push({
                    id: \`prov-\${finding.id}\`,
                    areaOfNeed: category,
                    outcome: "By the end of Year 6, XX will be able to read 50 high-frequency words on sight.",
                    provision: "Direct 1:1 multisensory literacy intervention (e.g. Precision Teaching)",
                    frequency: "Daily (5x 15 mins per week)",
                    staffing: "Specialist Teaching Assistant",
                    justificationFindingId: finding.id
                });
            }
            else if (category === 'semh' && finding.text.includes('share')) {
                 specs.push({
                    id: \`prov-\${finding.id}\`,
                    areaOfNeed: category,
                    outcome: "XX will be able to take turns in a small group game with 2 peers.",
                    provision: "Social Skills Group (Lego Therapy or similar)",
                    frequency: "Weekly (1x 45 mins)",
                    staffing: "ELSA (Emotional Literacy Support Assistant)",
                    justificationFindingId: finding.id
                });
            }
            else {
                // Generic Fallback
                 specs.push({
                    id: \`prov-\${finding.id}\`,
                    areaOfNeed: category,
                    outcome: "Will demonstrate progress in identified area of need.",
                    provision: "Differentiation of curriculum materials and visual supports.",
                    frequency: "Throughout the school day",
                    staffing: "Class Teacher",
                    justificationFindingId: finding.id
                });
            }
        });

        return specs;
    }
}
