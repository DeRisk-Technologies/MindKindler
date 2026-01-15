// src/types/report.ts

/**
 * The 4 Broad Areas of Need defined in the UK SEND Code of Practice.
 * Plus 'physical' as a common 5th bucket.
 */
export type NeedCategory = 
    | 'communication_interaction' // SLCN, ASD
    | 'cognition_learning'        // MLD, SLD, PMLD
    | 'semh'                      // Social, Emotional, Mental Health
    | 'sensory_physical'          // Hearing, Vision, Physical Disability
    | 'independence_self_care';   // Preparation for Adulthood

/**
 * An atomic piece of clinical information extracted from raw evidence.
 * This is the "Unit of Truth" for the report.
 */
export interface Finding {
    id: string;
    
    /** The ID of the document/artifact where this finding originated */
    sourceId: string;
    
    /** The category of need this finding relates to */
    category: NeedCategory;
    
    /** The core assertion (e.g., "Mother reports XX cannot tie shoelaces") */
    text: string;
    
    /** 
     * True if another source explicitly contradicts this.
     * Example: School says "Attendance 90%", Parent says "Attendance 40%".
     */
    isContested: boolean;
    
    /**
     * Confidence score from the AI (0-1).
     * Low confidence findings might need human review.
     */
    confidence: number;
    
    /**
     * Tags for specific topics (e.g. "sleep", "literacy", "anxiety")
     * Used for grouping during discrepancy detection.
     */
    topics: string[];
}

/**
 * Represents a row in the Section F (Provision) Table of an EHCP.
 * Must adhere to the "Specific & Quantified" legal standard (Noddy '93 Case Law).
 */
export interface ProvisionSpec {
    id: string;
    
    /** The Need this provision addresses (Section B reference) */
    areaOfNeed: NeedCategory;
    
    /** The SMART Outcome aimed for (Section E) */
    outcome: string; // e.g., "By end of KS2, XX will be able to..."
    
    /** The specific support to be provided (Section F) */
    provision: string; // e.g., "Weekly Speech Therapy"
    
    /** How often? (Must be specific, e.g., "3x 20mins per week") */
    frequency: string;
    
    /** Who delivers it? (e.g., "Specialist Teacher", "TA") */
    staffing: string;
    
    /** Link back to the finding that justified this need */
    justificationFindingId: string;
}

export type ReportSectionName = 
    | 'background_history' 
    | 'views_interests_aspirations' // Section A
    | 'special_educational_needs'   // Section B
    | 'health_needs'                // Section C
    | 'social_care_needs'           // Section D
    | 'outcomes'                    // Section E
    | 'special_educational_provision'; // Section F

/**
 * The structured Draft Report container.
 * This holds the state before it is rendered into a DOCX/PDF.
 */
export interface DraftReport {
    id: string;
    caseId: string;
    
    /** The extracted "facts" that underpin the report */
    findings: Finding[];
    
    /** The narrative text blocks (The Story) */
    narrativeSections: Record<ReportSectionName, string>;
    
    /** The structured table of support (The Plan) */
    provisionPlan: ProvisionSpec[];
    
    createdAt: string;
    generatedByAiModel: string; // e.g., "gemini-1.5-flash"
}
