// src/lib/ai/gap-analysis.ts
import { ReportTelemetry } from "@/types/schema";

export interface TrainingSuggestion {
    moduleId: string;
    title: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

export function analyzeTrainingNeeds(telemetry: ReportTelemetry[]): TrainingSuggestion[] {
    const suggestions: TrainingSuggestion[] = [];
    const groupedBySection: Record<string, number[]> = {};

    // Group edits by section ID (normalize ID for safety)
    telemetry.forEach(t => {
        const key = t.sectionId.toLowerCase();
        if (!groupedBySection[key]) groupedBySection[key] = [];
        groupedBySection[key].push(t.editDistance);
    });

    // Analyze Patterns
    
    // 1. Sensory Needs Pattern
    // Matches IDs like 'sensory', 'section_b_sensory', 'sensory_physical'
    const sensoryKeys = Object.keys(groupedBySection).filter(k => k.includes('sensory'));
    const sensoryEdits = sensoryKeys.flatMap(k => groupedBySection[k]);
    
    if (sensoryEdits.length > 0) {
        const avg = sensoryEdits.reduce((a, b) => a + b, 0) / sensoryEdits.length;
        if (avg > 40) {
            suggestions.push({
                moduleId: 'mod_sensory_processing',
                title: 'Advanced Sensory Processing',
                reason: `Heavy edits detected in Sensory sections (Avg ${Math.round(avg)}% rewritten).`,
                priority: 'high'
            });
        }
    }

    // 2. Legal / Section F Pattern
    // Matches 'section_f', 'provision', 'recommendations'
    const provisionKeys = Object.keys(groupedBySection).filter(k => k.includes('section_f') || k.includes('provision'));
    const provisionEdits = provisionKeys.flatMap(k => groupedBySection[k]);
    
    if (provisionEdits.length > 0) {
        const avg = provisionEdits.reduce((a, b) => a + b, 0) / provisionEdits.length;
        if (avg > 30) {
            suggestions.push({
                moduleId: 'mod_send_law',
                title: 'SEND Law Refresher: Specificity',
                reason: `Significant rewrites in Provision sections (Avg ${Math.round(avg)}%). Check quantification standards.`,
                priority: 'medium'
            });
        }
    }

    return suggestions;
}
