// src/lib/ai/triangulation-engine.ts (UPDATED)

import { Finding } from "../../types/report";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export class TriangulationEngine {
    
    async extractFindings(evidenceText: string, sourceId: string): Promise<Finding[]> {
        const extractFn = httpsCallable(functions, 'extractFindings');
        
        try {
            const result = await extractFn({ evidenceText });
            const data = result.data as any;
            
            return data.findings.map((f: any, index: number) => ({
                id: `finding-${sourceId}-${index}`,
                sourceId: sourceId,
                category: f.category,
                text: f.text,
                isContested: false,
                confidence: 0.9,
                topics: f.topics
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async detectDiscrepancies(findings: Finding[]): Promise<Finding[]> {
        // Logic remains client-side for now as it's just sorting
        // Can move to cloud if heavy NLP needed
        const findingsByTopic: Record<string, Finding[]> = {};
        
        for (const finding of findings) {
            for (const topic of finding.topics) {
                if (!findingsByTopic[topic]) findingsByTopic[topic] = [];
                findingsByTopic[topic].push(finding);
            }
        }
        
        for (const topic in findingsByTopic) {
            const group = findingsByTopic[topic];
            const uniqueSources = new Set(group.map(f => f.sourceId));
            if (uniqueSources.size > 1) {
                 group.forEach(f => f.isContested = true);
            }
        }
        
        return findings;
    }
}
