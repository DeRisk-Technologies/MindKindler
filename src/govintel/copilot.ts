import { GovSnapshot } from "@/analytics/govSnapshots";
import { retrieveContext } from "@/ai/knowledge/retrieve";
import { KnowledgeChunk } from "@/types/schema";

/**
 * Policy Co-Pilot Engine
 * Generates narrative insights from snapshots + evidence.
 */

export interface CopilotOutput {
    html: string;
    citations: KnowledgeChunk[];
    confidence: 'high' | 'medium' | 'low';
}

export async function generatePolicyMemo(
    snapshot: GovSnapshot,
    context: { scopeType: string, scopeId: string },
    memoType: 'briefing' | 'policy' | 'safeguarding'
): Promise<CopilotOutput> {
    
    // 1. Analyze Metrics
    const issues: string[] = [];
    if (snapshot.metrics.safeguarding.critical > 5) issues.push("safeguarding");
    if (snapshot.metrics.interventions.worsening > 10) issues.push("intervention efficacy");
    
    // 2. Retrieve Evidence (Contextual RAG)
    const query = issues.length > 0 ? `guidelines for ${issues.join(" and ")}` : "general education policy update";
    const retrievalResults = await retrieveContext(query, { verifiedOnly: true });
    const citations = retrievalResults.map(r => r.chunk);

    // 3. Generate Narrative (Mock Template)
    let narrative = `<h2>Executive Summary</h2><p>This ${memoType} addresses current operational trends within the ${context.scopeType} jurisdiction.</p>`;
    
    if (issues.length > 0) {
        narrative += `<h3>Key Findings</h3><p>Data indicates rising concerns in <strong>${issues.join(", ")}</strong>. Specifically, critical safeguarding incidents have reached ${snapshot.metrics.safeguarding.critical}.</p>`;
    } else {
        narrative += `<h3>Key Findings</h3><p>Operational metrics remain stable. Assessment volume is ${snapshot.metrics.assessments.total}.</p>`;
    }

    narrative += `<h3>Recommended Actions</h3><ul>
        <li>Review staffing levels for high-risk schools.</li>
        <li>Deploy targeted training modules (see citations).</li>
    </ul>`;

    // 4. Determine Confidence
    // If data is suppressed ("—" in UI logic), confidence is lower
    // Here we just check total volume
    const confidence = snapshot.metrics.assessments.total > 10 ? 'high' : 'medium';

    return {
        html: narrative,
        citations,
        confidence
    };
}
