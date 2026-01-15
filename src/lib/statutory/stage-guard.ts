import { GapReport } from "./gap-scanner";
import { StatutoryStageId } from "../../config/statutory-stages";

export interface TransitionCheck {
    allowed: boolean;
    blockingReasons: string[];
}

/**
 * Stage Guard: Ensures users cannot jump statutory phases without meeting legal/clinical criteria.
 * 
 * @param targetStage - The stage the user is trying to ENTER.
 * @param gapReport - The current "Gap Analysis" of the case evidence.
 * @param hasDraftReport - Boolean indicating if a draft EHC Plan exists (required for later stages).
 * @returns TransitionCheck object.
 */
export function validateStageTransition(
    targetStage: StatutoryStageId, 
    gapReport: GapReport,
    hasDraftReport: boolean = false
): TransitionCheck {
    
    const errors: string[] = [];

    switch (targetStage) {
        case 'intake':
            // Intake is the entry point, always allowed to view.
            break;

        case 'assessment':
            // To enter assessment, we generally need the basic setup done.
            // But usually this transition is driven by Date or LA Decision, not evidence.
            // We'll keep it open but maybe warn.
            break;

        case 'drafting':
            // STRICT GATE: Cannot start drafting without core evidence.
            // This prevents "Empty Reports".
            
            // 1. Check Universal Statutory Requirements
            if (gapReport.missingItems.includes("Parental Advice (Section A)")) {
                errors.push("Cannot draft: Missing Parental Advice (Section A).");
            }
            if (gapReport.missingItems.includes("School/Setting Educational Advice")) {
                errors.push("Cannot draft: Missing School Advice (Section B).");
            }

            // 2. Check Clinical Requirements (e.g. Social Care)
            if (gapReport.missingItems.includes("Social Care Statutory Advice (Looked After Child / CIN)")) {
                errors.push("Cannot draft: Safeguarding/Social Care advice is missing for this Looked After Child.");
            }
            
            // 3. Check for specific medical reports if critical (e.g. Hearing for non-verbal)
            // (Optional strictness - handled by gapReport logic generally)
            break;

        case 'consultation':
            // To enter Consultation, you MUST have a Draft.
            if (!hasDraftReport) {
                errors.push("Cannot enter Consultation: No Draft EHC Plan has been generated.");
            }
            break;

        case 'final':
            // To Finalize, consultation must be done (handled by timeline mostly) AND draft must exist.
            if (!hasDraftReport) {
                errors.push("Cannot Finalize: No EHC Plan exists.");
            }
            // In real app, check for "Consultation Response" too.
            break;
    }

    return {
        allowed: errors.length === 0,
        blockingReasons: errors
    };
}
