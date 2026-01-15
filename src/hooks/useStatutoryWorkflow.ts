"use client";

import { useMemo } from 'react';
import { differenceInDays, addWeeks, parseISO, isValid } from 'date-fns';
import { CaseFile } from '../types/case';
import { StatutoryDeadlines, calculateStatutoryTimeline } from '../lib/statutory/timeline-calculator';
import { EHCP_STAGES, StatutoryStageConfig, StatutoryStageId, StatutoryToolId } from '../config/statutory-stages';
import { GapReport } from '../lib/statutory/gap-scanner';
import { validateStageTransition } from '../lib/statutory/stage-guard';

export type RAGStatus = 'red' | 'amber' | 'green';

export interface WorkflowState {
    /** The active configuration object for the current stage */
    currentStage: StatutoryStageConfig;
    
    /** Days remaining until the END of the current stage */
    daysRemainingInStage: number;
    
    /** Days until the HARD statutory deadline (Week 20) */
    daysUntilFinalDeadline: number;
    
    /** Urgency indicator */
    ragStatus: RAGStatus;
    
    /** Has the deadline for this stage passed? */
    isBreachRisk: boolean;
    
    /** Tools that should be enabled in the UI Sidebar */
    activeTools: StatutoryToolId[];
    
    /** Can the user legally/clinically move to the next stage? */
    canProceed: boolean;
    
    /** Why they can't proceed (if applicable) */
    blockers: string[];
}

/**
 * React Hook that acts as the "Controller" for the Statutory Dashboard.
 * It combines Time (Deadlines) + Data (CaseFile) + Rules (Guard) to drive the UI.
 * 
 * @param caseFile - The current case data.
 * @param gapReport - Analysis of missing evidence (optional, defaults to safe state).
 * @param hasDraftReport - Whether a draft document exists (optional).
 */
export function useStatutoryWorkflow(
    caseFile: CaseFile,
    gapReport?: GapReport,
    hasDraftReport: boolean = false
): WorkflowState {

    // 1. Calculate Timeline Baseline
    const timeline: StatutoryDeadlines = useMemo(() => {
        const reqDate = caseFile?.statutoryTimeline?.requestDate 
            ? parseISO(caseFile.statutoryTimeline.requestDate)
            : new Date(); // Fallback if new
        return calculateStatutoryTimeline(reqDate);
    }, [caseFile?.statutoryTimeline?.requestDate]);

    // 2. Determine Current Stage based on Today vs Timeline
    const today = new Date();
    const requestDate = parseISO(timeline.requestDate);
    const daysSinceRequest = isValid(requestDate) ? differenceInDays(today, requestDate) : 0;
    const weeksSinceRequest = daysSinceRequest / 7;

    const currentStageConfig = useMemo(() => {
        // Find the stage that encompasses the current week
        // Default to Intake if early, Final if late.
        const stage = EHCP_STAGES.find(s => weeksSinceRequest >= s.weekStart && weeksSinceRequest < s.weekEnd);
        return stage || (weeksSinceRequest >= 20 ? EHCP_STAGES[EHCP_STAGES.length - 1] : EHCP_STAGES[0]);
    }, [weeksSinceRequest]);

    // 3. Calculate Days Remaining
    const stageEndDate = addWeeks(requestDate, currentStageConfig.weekEnd);
    const daysRemaining = differenceInDays(stageEndDate, today);
    const finalDeadlineDate = parseISO(timeline.finalPlanDeadline);
    const daysUntilFinal = differenceInDays(finalDeadlineDate, today);

    // 4. Determine RAG Status
    let rag: RAGStatus = 'green';
    if (daysRemaining < 0) rag = 'red'; // Overdue
    else if (daysRemaining < 5) rag = 'red'; // Urgent
    else if (daysRemaining < 10) rag = 'amber'; // Warning

    // 5. Check Gate Logic (Can we move forward?)
    // We check eligibility for the *next* stage.
    const currentIndex = EHCP_STAGES.findIndex(s => s.id === currentStageConfig.id);
    const nextStage = EHCP_STAGES[currentIndex + 1];
    
    let canProceed = false;
    let blockers: string[] = [];

    if (nextStage && gapReport) {
        const check = validateStageTransition(nextStage.id, gapReport, hasDraftReport);
        canProceed = check.allowed;
        blockers = check.blockingReasons;
    } else if (!nextStage) {
        // Already at final stage
        canProceed = false;
        blockers = ["Case is at Final Stage"];
    }

    return {
        currentStage: currentStageConfig,
        daysRemainingInStage: daysRemaining,
        daysUntilFinalDeadline: daysUntilFinal,
        ragStatus: rag,
        isBreachRisk: daysRemaining < 0,
        activeTools: currentStageConfig.requiredTools,
        canProceed,
        blockers
    };
}
