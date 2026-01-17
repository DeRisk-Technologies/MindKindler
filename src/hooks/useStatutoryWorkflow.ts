// src/hooks/useStatutoryWorkflow.ts

import { useMemo } from 'react';
import { differenceInDays, addWeeks, parseISO, isValid } from 'date-fns';
import { CaseFile } from '../types/case';
import { StatutoryDeadlines, calculateStatutoryTimeline } from '../lib/statutory/timeline-calculator';
import { EHCP_STAGES, StatutoryStageConfig, StatutoryStageId, StatutoryToolId } from '../config/statutory-stages';
import { GapReport } from '../lib/statutory/gap-scanner';
import { validateStageTransition } from '../lib/statutory/stage-guard';

export type RAGStatus = 'red' | 'amber' | 'green';

export interface WorkflowState {
    currentStage: StatutoryStageConfig;
    daysRemainingInStage: number;
    daysUntilFinalDeadline: number;
    daysUntilContractDeadline: number | null;
    ragStatus: RAGStatus;
    isBreachRisk: boolean;
    activeTools: StatutoryToolId[];
    canProceed: boolean;
    blockers: string[];
}

// Default "Empty" State to return during loading
const DEFAULT_STATE: WorkflowState = {
    currentStage: EHCP_STAGES[0],
    daysRemainingInStage: 0,
    daysUntilFinalDeadline: 0,
    daysUntilContractDeadline: null,
    ragStatus: 'green',
    isBreachRisk: false,
    activeTools: [],
    canProceed: false,
    blockers: []
};

export function useStatutoryWorkflow(
    caseFile: CaseFile | null | undefined, // Allow null
    gapReport?: GapReport,
    hasDraftReport: boolean = false
): WorkflowState {

    // 1. Safety Check: If loading or invalid, return safe default
    if (!caseFile || !caseFile.statutoryTimeline) {
        return DEFAULT_STATE;
    }

    // 2. Calculate Timeline Baseline
    const timeline: StatutoryDeadlines = calculateStatutoryTimeline(
        caseFile.statutoryTimeline.requestDate 
            ? parseISO(caseFile.statutoryTimeline.requestDate)
            : new Date()
    );

    // 3. Determine Current Stage
    const today = new Date();
    const requestDate = parseISO(timeline.requestDate);
    const daysSinceRequest = isValid(requestDate) ? differenceInDays(today, requestDate) : 0;
    const weeksSinceRequest = daysSinceRequest / 7;

    const currentStageConfig = EHCP_STAGES.find(s => weeksSinceRequest >= s.weekStart && weeksSinceRequest < s.weekEnd) 
        || (weeksSinceRequest >= 20 ? EHCP_STAGES[EHCP_STAGES.length - 1] : EHCP_STAGES[0]);

    // 4. Calculate Days Remaining
    const stageEndDate = addWeeks(requestDate, currentStageConfig.weekEnd);
    const daysRemaining = differenceInDays(stageEndDate, today);
    const finalDeadlineDate = parseISO(timeline.finalPlanDeadline);
    const daysUntilFinal = differenceInDays(finalDeadlineDate, today);
    
    // NEW: EPP Contract Logic
    let daysUntilContractDeadline = null;
    if (caseFile.contract?.dueDate) {
        const contractDate = parseISO(caseFile.contract.dueDate);
        if (isValid(contractDate)) {
            daysUntilContractDeadline = differenceInDays(contractDate, today);
        }
    }

    // 5. Determine RAG Status
    let rag: RAGStatus = 'green';
    const deadlineToCheck = daysUntilContractDeadline !== null ? daysUntilContractDeadline : daysRemaining;
    
    if (deadlineToCheck < 0) rag = 'red';
    else if (deadlineToCheck < 5) rag = 'red';
    else if (deadlineToCheck < 10) rag = 'amber';

    // 6. Check Gate Logic
    const currentIndex = EHCP_STAGES.findIndex(s => s.id === currentStageConfig.id);
    const nextStage = EHCP_STAGES[currentIndex + 1];
    
    let canProceed = false;
    let blockers: string[] = [];

    if (nextStage && gapReport) {
        const check = validateStageTransition(nextStage.id, gapReport, hasDraftReport);
        canProceed = check.allowed;
        blockers = check.blockingReasons;
    } else if (!nextStage) {
        canProceed = false;
        blockers = ["Case is at Final Stage"];
    }

    return {
        currentStage: currentStageConfig,
        daysRemainingInStage: daysRemaining,
        daysUntilFinalDeadline: daysUntilFinal,
        daysUntilContractDeadline,
        ragStatus: rag,
        isBreachRisk: deadlineToCheck < 0,
        activeTools: currentStageConfig.requiredTools,
        canProceed,
        blockers
    };
}
