// src/app/actions/intervention.ts
"use server";

import { ai } from "@/ai/genkit";
import { FEATURE_MODEL_DEFAULTS } from "@/ai/config";
import { StudentRecord, AssessmentResult } from "@/types/schema";
import { InterventionLogic } from "@/marketplace/types";

// Types
export interface PlannedIntervention {
    id: string;
    programName: string;
    category: string;
    rationale: string;
    duration: string; // e.g. "6 weeks"
    frequency: string; // e.g. "Daily, 15 mins"
    evidenceLevel: 'gold' | 'silver' | 'bronze';
    steps: string[];
}

export interface PlanningContext {
    transcript: string;
    student: Partial<StudentRecord>;
    assessments: AssessmentResult[];
    clinicalOpinions?: any[]; // Added clinicalOpinions
    availableInterventions: InterventionLogic[]; // From Marketplace Pack
}

/**
 * Generates a tailored intervention plan by mapping student needs to the tenant's approved library.
 */
export async function generateInterventionPlanAction(context: PlanningContext): Promise<PlannedIntervention[]> {
    
    // 1. Prepare Data for Prompt
    const needsSummary = summarizeNeeds(context);
    const libraryContext = formatLibrary(context.availableInterventions);

    // 2. Construct Prompt
    const prompt = `
    You are a Clinical Intervention Specialist. 
    Create a 3-point Intervention Plan for a student based on their assessment profile, CONFIRMED clinical opinions, and consultation evidence.

    STUDENT PROFILE:
    ${needsSummary}

    CONFIRMED CLINICAL OPINIONS (Use these to drive recommendations):
    ${context.clinicalOpinions ? JSON.stringify(context.clinicalOpinions, null, 2) : "None provided."}

    TRANSCRIPT EXCERPTS (Clinical Evidence):
    "${context.transcript.slice(0, 3000)}..."

    APPROVED INTERVENTION LIBRARY (Use ONLY these if applicable):
    ${libraryContext}

    INSTRUCTIONS:
    1. Select the best matching interventions from the Library based on the CONFIRMED OPINIONS and Assessment Scores. 
       - If a confirmed opinion identifies a "Language" deficit, prioritize "Language" interventions.
    2. If no library item matches perfectly, suggest a standard clinical strategy but mark evidence as 'bronze'.
    3. For each intervention, write a clear Rationale linking it to the specific clinical opinion or score (e.g. "Due to confirmed Low VCI...").
    4. Define practical steps for a teacher.

    OUTPUT FORMAT:
    JSON Array of objects:
    {
        "programName": string,
        "category": string (e.g. "Language", "Social", "Memory"),
        "rationale": string,
        "duration": string,
        "frequency": string,
        "evidenceLevel": "gold"|"silver"|"bronze",
        "steps": string[]
    }
    `;

    // 3. Call AI
    try {
        const { text } = await ai.generate({ 
            model: FEATURE_MODEL_DEFAULTS.consultationInsights, // Using faster model for interaction
            prompt 
        });
        
        // 4. Parse & Enrich
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        const plans: PlannedIntervention[] = JSON.parse(jsonMatch[0]);
        
        // Add IDs
        return plans.map(p => ({
            ...p,
            id: Date.now().toString() + Math.random().toString().slice(2,5)
        }));

    } catch (error) {
        console.error("Intervention Planning Failed:", error);
        return []; // Fail gracefully
    }
}

function summarizeNeeds(context: PlanningContext): string {
    const { student, assessments } = context;
    let summary = "";

    // Identity
    if (student.identity?.dateOfBirth) summary += `- Age: Based on DOB ${student.identity.dateOfBirth.value}\n`;
    
    // SEN Status
    if (student.education?.senStatus) summary += `- SEN Status: ${student.education.senStatus.value}\n`;

    // Assessment Scores (Critical for mapping)
    if (assessments.length > 0) {
        summary += "\nASSESSMENT SCORES:\n";
        assessments.forEach(a => {
            summary += `- ${a.templateId}: Score ${a.totalScore}`;
            if (a.responses) {
                // Extract key sub-scores if available in simple map
                Object.entries(a.responses).forEach(([k, v]) => {
                    if (typeof v === 'number') summary += `, ${k}: ${v}`;
                });
            }
            summary += "\n";
        });
    }

    return summary;
}

function formatLibrary(interventions: InterventionLogic[]): string {
    if (!interventions || interventions.length === 0) return "No specific library provided. Recommend standard clinical best practices.";
    
    return interventions.map(i => 
        `- ID: ${i.id} | Name: ${i.programName} | Domain: ${i.domain} | Trigger: < ${i.threshold} | Evidence: ${i.evidenceLevel}`
    ).join('\n');
}
