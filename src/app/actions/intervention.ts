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
    clinicalOpinions?: any[]; 
    manualEntries?: string[]; 
    region?: string; 
    availableInterventions: InterventionLogic[];
    
    // NEW: Comprehensive Context Fields
    consultationReason?: string;
    consultationMode?: string; // 'person_centered' | 'complex' etc.
    lastTreatmentPlan?: any; // Previous plan for continuity
    observationNotes?: string; // From the Observation Mode
}

/**
 * Generates a tailored intervention plan by mapping student needs to the tenant's approved library.
 */
export async function generateInterventionPlanAction(context: PlanningContext): Promise<PlannedIntervention[]> {
    
    // 1. Prepare Data for Prompt
    const needsSummary = summarizeNeeds(context);
    const libraryContext = formatLibrary(context.availableInterventions);
    const region = context.region || "UK"; 

    // 2. Construct Prompt (Enhanced Context)
    const prompt = `
    You are a Clinical Intervention Specialist practicing in ${region}.
    Create a 3-point Intervention Plan for a student based on the following COMPREHENSIVE CLINICAL CONTEXT.

    ### 1. SESSION CONTEXT
    - Reason for Consultation: "${context.consultationReason || "General Assessment"}"
    - Clinical Mode: ${context.consultationMode || "Standard"} (Adjust tone accordingly)
    - Live Observations: "${context.observationNotes || "None recorded."}"

    ### 2. STUDENT PROFILE
    ${needsSummary}

    ### 3. CLINICAL EVIDENCE
    - Confirmed AI Opinions: ${context.clinicalOpinions ? JSON.stringify(context.clinicalOpinions, null, 2) : "None."}
    - Manual EPP Notes: ${context.manualEntries ? JSON.stringify(context.manualEntries) : "None."}
    - Transcript Excerpts: "${context.transcript.slice(0, 4000)}..."

    ### 4. HISTORY
    - Previous Intervention Plan: ${context.lastTreatmentPlan ? JSON.stringify(context.lastTreatmentPlan).slice(0, 1000) : "None available."}

    ### 5. APPROVED INTERVENTION LIBRARY
    (Select from this list if relevant):
    ${libraryContext}

    ### INSTRUCTIONS:
    1. ANALYZE SPEAKER DYNAMICS: Differentiate between the EPP (Professional) and Student/Parent in the transcript to understand the full context of the dialogue.
    2. SYNTHESIZE: Combine the WISC-V scores (if present) with the qualitative transcript evidence and your confirmed opinions.
    3. CONTINUITY: If a previous plan exists, build upon it or explain why a change is needed based on new evidence.
    4. SELECT: Choose the best matching interventions. Prioritize the "Approved Library" but suggest standard clinical strategies if gaps exist.
    5. JUSTIFY: Write a clear Rationale for each point, linking it to specific evidence (e.g., "Due to low Matrix Reasoning score of 85...").
    6. COMPLIANCE: Cite relevant ${region} educational law (e.g., SEND Code of Practice 2015, IDEA) where applicable.

    OUTPUT FORMAT:
    JSON Array of objects:
    {
        "programName": string,
        "category": string,
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
            model: FEATURE_MODEL_DEFAULTS.consultationInsights, 
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
        return []; 
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
