import { StudentContact } from "./schema";

/**
 * Represents the current status of a Statutory Case in the UK SEND framework.
 * @see https://www.gov.uk/children-with-special-educational-needs/extra-sen-help
 */
export type CaseStatus = 
    | 'intake'          // Initial request received, triaging
    | 'assessment'      // Active assessment period (Weeks 0-16)
    | 'drafting'        // Writing the EHC Plan
    | 'consultation'    // Draft sent to parents/schools for comments (15 days)
    | 'finalized'       // Final Plan issued (Week 20)
    | 'closed';         // Case closed or ceased

/**
 * Stakeholder Roles in an EHC Needs Assessment.
 * - 'senco': Special Educational Needs Coordinator (School)
 * - 'epp_lead': Educational Psychologist managing the case
 * - 'social_worker': Assigned social worker (if any)
 * - 'pediatrician': Community Pediatrician (Health advice)
 */
export type StakeholderRole = 'parent' | 'senco' | 'social_worker' | 'pediatrician' | 'class_teacher' | 'epp_lead';

export interface Stakeholder {
    id: string; // User ID or external contact ID
    role: StakeholderRole;
    name: string;
    contactInfo: {
        email: string;
        phone?: string;
        organization?: string; // e.g., "NHS Trust", "Leeds City Council"
    };
    /** Has this stakeholder formally agreed to participate/share info? */
    consentStatus: 'pending' | 'granted' | 'refused';
    /** Status of their professional advice (Section A-K contributions) */
    contributionStatus: 'not_requested' | 'requested' | 'received';
    /** Link to the specific evidence/report they submitted */
    evidenceId?: string; 
}

/**
 * Tracks the critical legal deadlines for a UK EHC Needs Assessment (20-Week Process).
 * All dates are strict deadlines based on the Request Date (Week 0).
 */
export interface StatutoryTimeline {
    /** Week 0: The date the Local Authority (LA) received the request */
    requestDate: string; // ISO Date

    /** Week 6: Deadline for LA to decide whether to assess */
    decisionToAssessDeadline: string; // ISO Date (+42 days)
    decisionMadeAt?: string; // ISO Date

    /** Week 12: Target for all professional advice (EP, Health, Social) to be received */
    evidenceDeadline: string; // ISO Date (+84 days)
    
    /** Week 16: Deadline to issue the Draft EHC Plan */
    draftPlanDeadline: string; // ISO Date (+112 days)
    draftIssuedAt?: string; // ISO Date

    /** Week 20: Absolute legal deadline for Final EHC Plan */
    finalPlanDeadline: string; // ISO Date (+140 days)
    finalizedAt?: string; // ISO Date

    /** Is the case currently compliant with the timeline? */
    isOverdue: boolean;
}

/**
 * Critical risk indicators that alter the assessment pathway.
 */
export interface CaseFlags {
    /** Clinical flag: Determines assessment tools (e.g., non-verbal reasoning vs WISC-V) */
    isNonVerbal: boolean;
    /** Procedural flag: Requires 2 adults present during home visits */
    requiresGuardianPresence: boolean;
    /** Multi-agency flag: Triggers social care statutory advice request */
    hasSocialWorker: boolean;
    /** Critical: Immediate risk to life or limb identified */
    safeguardingRisk: boolean;
}

/**
 * The Root Object for a Statutory Case (EHC Needs Assessment).
 * This aggregates the Student, the Process, and the Legal Timeline.
 */
export interface CaseFile {
    id: string;
    tenantId: string;
    
    // --- Core Metadata ---
    studentId: string;
    studentName: string;
    dob: string; // ISO Date
    /** Unique Pupil Number (UK Govt ID) - Vital for LA data matching */
    upn?: string; 
    /** The Local Authority responsible for funding (e.g., 'Leeds', 'Camden') */
    localAuthorityId: string; 
    /** Regional shard ID for data sovereignty (e.g., 'uk-lon', 'uk-manc') */
    region: string; 

    // --- Status & Process ---
    status: CaseStatus;
    flags: CaseFlags;
    
    // --- Stakeholders ---
    /** Map of all professionals and family involved */
    stakeholders: Stakeholder[];

    // --- Timeline ---
    /** The "Statutory Clock" tracking legal adherence */
    statutoryTimeline: StatutoryTimeline;

    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
