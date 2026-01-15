import { addDays, isWeekend, formatISO } from 'date-fns';

/**
 * Interface representing the critical statutory milestones in a UK EHC Needs Assessment.
 * Based on the SEND Code of Practice (2015).
 */
export interface StatutoryDeadlines {
  requestDate: string;
  decisionToAssessDeadline: string; // Week 6
  evidenceDeadline: string;         // Week 12 (Internal Target)
  draftPlanDeadline: string;        // Week 16
  finalPlanDeadline: string;        // Week 20
}

/**
 * Calculates the legal deadlines for a UK EHC Needs Assessment (20-Week Process).
 * 
 * Rules:
 * - Week 0: Request Received.
 * - Week 6 (+42 days): LA must decide *whether* to assess.
 * - Week 16 (+112 days): If assessing, Draft Plan must be issued.
 * - Week 20 (+140 days): Final Plan must be issued.
 * 
 * Note on Week 12: There is no hard legal deadline for "Evidence Collection" in the Act,
 * but typical best practice is to have all advice (EP, Health, Social) in by Week 12
 * to allow 4 weeks for drafting the plan before the Week 16 deadline.
 * 
 * @param requestDate - The date the EHC Request was formally received by the Local Authority.
 * @returns Object containing ISO date strings for all major deadlines.
 */
export function calculateStatutoryTimeline(requestDate: Date): StatutoryDeadlines {
  
  // Helper to add days and return ISO string
  // We strictly follow calendar days as per the legislation (The Special Educational Needs and Disability Regulations 2014)
  // Exceptions for holidays/weekends usually apply to "response times" (e.g. 15 days to comment), 
  // but the 20-week ceiling is generally treated as a hard stop in reporting.
  const calculateDeadline = (days: number): string => {
    return formatISO(addDays(requestDate, days));
  };

  return {
    requestDate: formatISO(requestDate),
    
    // Regulation 4(1): Decision must be made within 6 weeks of request
    decisionToAssessDeadline: calculateDeadline(42),
    
    // Internal Milestone: Advice typically requested immediately after decision (Week 6)
    // and given 6 weeks to return (Week 12). Regulation 8(1) gives professionals 6 weeks.
    // 6 weeks (decision) + 6 weeks (advice collection) = 12 weeks.
    evidenceDeadline: calculateDeadline(84), 
    
    // Regulation 13(2): Draft Plan must be sent. 
    // Although the reg says "send the finalized plan as soon as practicable, but within 20 weeks",
    // customary practice is Draft at Week 16 to allow for the 15-day parent consultation period (Reg 13(1)).
    draftPlanDeadline: calculateDeadline(112), 
    
    // Regulation 13(2): Final Plan deadline.
    finalPlanDeadline: calculateDeadline(140),
  };
}

/**
 * Checks if a specific milestone is overdue.
 * @param deadlineIso - The target deadline in ISO format.
 * @param completionDateIso - (Optional) When the step was actually completed.
 * @returns boolean - True if the deadline has passed and the step is incomplete.
 */
export function isMilestoneOverdue(deadlineIso: string, completionDateIso?: string): boolean {
  if (completionDateIso) return false; // Completed, so not overdue
  
  const now = new Date();
  const deadline = new Date(deadlineIso);
  
  return now > deadline;
}
