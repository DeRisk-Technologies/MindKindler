// src/lib/ai/triangulation-engine.ts

import { Finding, NeedCategory } from "../../types/report";

// Mock Vertex AI interface for development
interface VertexResponse {
    findings: Array<{
        category: string;
        text: string;
        topics: string[];
    }>;
}

/**
 * The Triangulation Engine.
 * 
 * Responsibility:
 * 1. Read raw text from multiple sources (Parent, School, Medical).
 * 2. Extract distinct "Findings" (Facts/Assertions).
 * 3. Detect "Discrepancies" (Conflict) between sources.
 */
export class TriangulationEngine {
    
    /**
     * Extracts structured findings from a single document's text.
     * 
     * @param evidenceText - Raw text content of the document.
     * @param sourceId - ID of the EvidenceItem (for citation).
     */
    async extractFindings(evidenceText: string, sourceId: string): Promise<Finding[]> {
        
        // 1. Construct System Prompt
        // Enforce STRICT JSON output and SEND Categories.
        const systemPrompt = `
You are a Clinical Data Analyst for UK Special Education.
Your task is to analyze clinical reports and extract "Findings" (distinct assertions about a child's needs).

Input Text: "${evidenceText.substring(0, 500)}..." (truncated for log)

Output Format (STRICT JSON Array):
[
  {
    "category": "communication_interaction" | "cognition_learning" | "semh" | "sensory_physical" | "independence_self_care",
    "text": "The assertion text (e.g. 'Mother reports sleep disturbance')",
    "topics": ["keyword1", "keyword2"] (e.g. ['sleep', 'anxiety'])
  }
]

Rules:
- Categorize accurately based on the SEND Code of Practice.
- Extract both strengths and difficulties.
- "topics" are keywords used to compare this finding with others later.
`;

        // TODO: Call Vertex AI here.
        // const result = await vertexClient.generate(systemPrompt);
        
        // MOCK Response for Phase 48
        const mockResponse: VertexResponse = this.getMockFindings(evidenceText);
        
        return mockResponse.findings.map((f, index) => ({
            id: \`finding-\${sourceId}-\${index}\`,
            sourceId: sourceId,
            category: f.category as NeedCategory,
            text: f.text,
            isContested: false, // Default to false, calculated later
            confidence: 0.9,
            topics: f.topics
        }));
    }

    /**
     * Analyzes a collection of findings to identify contradictions.
     * Sets `isContested = true` on findings that conflict.
     * 
     * Logic:
     * - Group findings by 'Topic'.
     * - If topic 'sleep' has assertions from different sources that differ significantly (simulated), flag them.
     * 
     * (Note: Real contradiction detection requires a Semantic Comparison LLM call, 
     *  but we simulate the architecture here).
     */
    async detectDiscrepancies(findings: Finding[]): Promise<Finding[]> {
        
        const findingsByTopic: Record<string, Finding[]> = {};
        
        // 1. Group by Topic
        for (const finding of findings) {
            for (const topic of finding.topics) {
                if (!findingsByTopic[topic]) findingsByTopic[topic] = [];
                findingsByTopic[topic].push(finding);
            }
        }
        
        // 2. Analyze Groups (Simplified Heuristic)
        // In reality, we'd send these groups to an LLM: "Do these statements contradict?"
        for (const topic in findingsByTopic) {
            const group = findingsByTopic[topic];
            
            if (group.length > 1) {
                // If multiple sources talk about the same topic, we flag for human review
                // (Optimistic Contestation Strategy: Better to check than miss a conflict)
                
                // Only flag if from DIFFERENT sources
                const uniqueSources = new Set(group.map(f => f.sourceId));
                if (uniqueSources.size > 1) {
                     group.forEach(f => f.isContested = true);
                }
            }
        }
        
        return findings;
    }

    // --- MOCK DATA GENERATOR ---
    private getMockFindings(text: string): VertexResponse {
        const isSchool = text.toLowerCase().includes('school') || text.toLowerCase().includes('teacher');
        
        if (isSchool) {
            return {
                findings: [
                    { category: 'cognition_learning', text: 'Reading age is 2 years below chronological age.', topics: ['reading', 'literacy'] },
                    { category: 'semh', text: 'Struggles to share toys during unstructured times.', topics: ['social', 'play'] }
                ]
            };
        } else {
            // Parent/Home Context
            return {
                findings: [
                    { category: 'independence_self_care', text: 'Cannot tie shoelaces independently.', topics: ['motor_skills', 'dressing'] },
                    { category: 'semh', text: 'Anxious about attending school on Mondays.', topics: ['anxiety', 'school_refusal'] },
                    { category: 'sensory_physical', text: 'Sensitive to loud noises (hand dryers).', topics: ['sensory', 'auditory'] }
                ]
            };
        }
    }
}
