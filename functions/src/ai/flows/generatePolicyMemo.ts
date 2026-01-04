// functions/src/ai/flows/generatePolicyMemo.ts

import { retrieveContext } from "../knowledge/retrieve";
import { saveAiProvenance } from "../utils/provenance";
import { z } from "zod";
import { getGenkitInstance, getModelForFeature } from "../utils/model-selector";

// Output Schema
const PolicyMemoSchema = z.object({
    title: z.string(),
    executiveSummary: z.string(),
    findings: z.array(z.object({
        metric: z.string(),
        analysis: z.string(),
        severity: z.enum(['low', 'medium', 'high'])
    })),
    recommendations: z.array(z.object({
        action: z.string(),
        rationale: z.string(),
        impact: z.string()
    })),
    citationIds: z.array(z.string())
});

export async function generatePolicyMemoFlow(
    tenantId: string,
    snapshotData: any,
    focusArea: string,
    userId: string
) {
    const startTime = Date.now();

    // 0. Initialize AI
    const ai = await getGenkitInstance('govIntel');
    const modelName = await getModelForFeature('govIntel');

    // 1. RAG Retrieval
    // Search for guidelines relevant to the focus area and snapshot anomalies
    const query = `Policy guidelines for ${focusArea}. Metrics: ${JSON.stringify(snapshotData).substring(0, 200)}`;
    const evidence = await retrieveContext(tenantId, query, 5);
    
    // Format evidence for prompt
    const evidenceText = evidence.map(e => `[${e.id}]: ${e.text}`).join('\n');

    // 2. Construct Prompt
    const prompt = `
    You are a Senior Policy Advisor for the Department of Education.
    Task: Draft a policy briefing memo based on the provided regional data snapshot.
    
    Focus Area: ${focusArea}
    
    Regional Data (Snapshot):
    ${JSON.stringify(snapshotData, null, 2)}

    Relevant Guidelines (Evidence):
    ${evidenceText}

    Instructions:
    - Analyze the data for trends, risks, or successes.
    - Reference the provided guidelines using [ID] citations where applicable.
    - Provide actionable recommendations.
    - Tone: Formal, Strategic, Objective.

    Output: JSON matching the schema.
    `;

    // 3. Generate
    const { output } = await ai.generate({ 
        prompt, 
        config: { temperature: 0.2 } 
    });

    const rawText = output?.text || "{}";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
        parsed = JSON.parse(cleanJson);
        PolicyMemoSchema.parse(parsed); // Validation
    } catch (e: any) {
        console.warn("Policy Memo Validation Warning", e.message);
        // Fallback for demo if parsing fails completely
        if (!parsed) parsed = { title: "Error Generating Memo", executiveSummary: "AI parsing failed.", findings: [], recommendations: [], citationIds: [] };
    }

    // 4. Provenance
    await saveAiProvenance({
        tenantId,
        studentId: 'system',
        flowName: 'generatePolicyMemo',
        prompt,
        model: modelName,
        responseText: rawText,
        parsedOutput: parsed,
        latencyMs: Date.now() - startTime,
        createdBy: userId
    });

    // 5. Merge Evidence Metadata for UI
    const citations = evidence.filter(e => parsed.citationIds?.includes(e.id) || rawText.includes(e.id));
    
    return {
        ...parsed,
        citations // Return full citation objects for UI display
    };
}
