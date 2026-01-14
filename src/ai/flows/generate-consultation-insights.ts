'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { composeConsultationPrompt, EvidenceItem } from '@/ai/utils/composeConsultationPrompt';
import { FLOW_PARAMS } from '@/ai/config';
import { chunkTranscript, normalizeSpeakerTags } from '@/ai/utils/transcript';
import { applyGlossaryToStructured } from '@/ai/utils/glossarySafeApply';
import { StudentHistory } from '@/types/schema';

// Helper: Trajectory Analysis Logic (Deterministic)
function analyzeTrajectory(history: StudentHistory): any[] {
    if (!history || !history.attendance || !history.academic) return [];

    const insights = [];

    // 1. Analyze Attendance (Get most recent)
    // Sort by year descending (assuming academicYear format "YYYY-YYYY")
    const sortedAttendance = [...history.attendance].sort((a, b) => 
        b.academicYear.localeCompare(a.academicYear)
    );
    const latestAtt = sortedAttendance[0];

    if (!latestAtt) return [];

    const isLowAttendance = latestAtt.attendancePercentage < 85;

    // 2. Analyze Academic Trend (Simple Linear Check)
    // Sort by date ascending to see trend
    const sortedAcademic = [...history.academic]
        .filter(r => r.grade !== undefined && r.grade !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sortedAcademic.length < 2) return [];

    // Normalize grades to 0-100 scale if possible
    const normalizeGrade = (g: string | number): number | null => {
        if (typeof g === 'number') return g;
        if (!isNaN(parseFloat(g))) return parseFloat(g);
        // Basic Letter Mapping
        const map: Record<string, number> = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 };
        return map[g.toUpperCase()] || null;
    };

    const scores = sortedAcademic.map(r => normalizeGrade(r.grade)).filter(s => s !== null) as number[];
    
    if (scores.length < 2) return [];

    // Simple Trend: Compare Avg of first half vs Avg of second half
    const mid = Math.floor(scores.length / 2);
    const earlyAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const lateAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);

    const isDeclining = lateAvg < (earlyAvg - 5); // 5% drop threshold

    // 3. The "Unmet Need" Rule
    if (isLowAttendance && isDeclining) {
        insights.push({
            type: 'risk',
            text: "Potential Unmet Need: Academic decline correlates with low attendance.",
            confidence: 'high',
            rationale: `Attendance is critical (${latestAtt.attendancePercentage}%) while academic performance has trended downwards (from avg ~${earlyAvg.toFixed(0)} to ~${lateAvg.toFixed(0)}). This trajectory suggests the gap is widening.`,
            sources: []
        });
    }

    // 4. Pure Academic Decline Rule (even without attendance)
    if (isDeclining && !isLowAttendance) {
        insights.push({
            type: 'observation',
            text: "Academic Trajectory: Widening Gap detected.",
            confidence: 'medium',
            rationale: `Performance has dropped significantly over the recorded history (Trend: ${earlyAvg.toFixed(0)} -> ${lateAvg.toFixed(0)}).`,
            sources: []
        });
    }

    return insights;
}

export async function generateConsultationInsights(input: any) {
    
    const ConsultationInsightsOutputSchema = z.object({
      insights: z.array(z.object({
        type: z.enum(['diagnosis', 'treatment', 'risk', 'observation']),
        text: z.string(),
        confidence: z.enum(['low', 'medium', 'high']),
        rationale: z.string().optional(),
        sources: z.array(z.object({
            chunkIndex: z.number(),
            snippet: z.string().optional()
        })).optional()
      })),
    });

    let chunks = [];
    
    if (input.fullTranscript) {
        const normalized = normalizeSpeakerTags(input.fullTranscript);
        chunks = chunkTranscript(normalized);
    } else if (input.transcriptChunk) {
        chunks = [{ text: input.transcriptChunk, chunkIndex: 0, totalChunks: 1, startIndex: 0, endIndex: input.transcriptChunk.length }];
    } else {
        // Fallback: If no transcript, we can still run history analysis below
        chunks = [];
    }

    const allInsights: any[] = [];

    // 1. Run AI Analysis on Transcript
    const promises = chunks.map(async (chunk) => {
        const promptText = composeConsultationPrompt({
            baseInstruction: `You are a real-time AI Co-Pilot for an educational psychologist. Analyze the following transcript chunk (${chunk.chunkIndex + 1}/${chunk.totalChunks}) for a student (Age: ${input.studentAge || 'Unknown'}).
            Task: Identify any potential differential diagnoses, treatment ideas, risk factors (e.g. self-harm, abuse), or key observations.
            Output a list of concise insights.`,
            transcript: chunk.text,
            notes: input.currentNotes,
            locale: input.locale,
            languageLabel: input.languageLabel,
            glossary: input.glossary,
            evidence: input.evidence as EvidenceItem[],
        });

        const { output } = await ai.generate({
            prompt: promptText,
            output: { schema: ConsultationInsightsOutputSchema },
            config: FLOW_PARAMS.consultationInsights
        });

        if (output && output.insights) {
            if (input.glossary) {
                const { artifact } = applyGlossaryToStructured(output, input.glossary, ['insights[].text', 'insights[].rationale']);
                output.insights = artifact.insights;
            }

            return output.insights.map((i: any) => ({
                ...i,
                sources: [{ chunkIndex: chunk.chunkIndex, snippet: chunk.text.substring(0, 50) + "..." }]
            }));
        }
        return [];
    });

    const results = await Promise.all(promises);
    results.forEach(res => allInsights.push(...res));

    // 2. Run Deterministic Trajectory Analysis
    if (input.studentHistory) {
        const historyInsights = analyzeTrajectory(input.studentHistory as StudentHistory);
        allInsights.push(...historyInsights);
    }

    // 3. Deduplicate
    const aggregatedInsights: any[] = [];
    const map = new Map<string, any>();

    for (const insight of allInsights) {
        const key = `${insight.type}:${insight.text.toLowerCase().trim()}`;
        if (map.has(key)) {
            const existing = map.get(key)!;
            if (insight.sources) {
                existing.sources = [...(existing.sources || []), ...insight.sources];
            }
        } else {
            map.set(key, insight);
        }
    }

    return { insights: Array.from(map.values()) };
}
