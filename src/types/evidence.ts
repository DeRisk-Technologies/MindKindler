/**
 * Represents the status of AI data extraction for a document.
 */
export type ExtractionStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'needs_review';

/**
 * Categorization of statutory documents in a UK SEND Context.
 */
export type EvidenceCategory = 
    | 'parental_advice'        // Section A: Parent/Carer views
    | 'school_report'          // Section B: School/SENCO information
    | 'medical_report'         // Section C: Community Pediatrician / GP
    | 'social_care_report'     // Section D: Social Services
    | 'previous_ehcp'          // Historical plans
    | 'educational_psychology' // Previous EP reports
    | 'hearing_vision'         // Clinical sensory checks
    | 'speech_language'        // SaLT Report
    | 'other';

/**
 * Represents a single file or artifact ingested into the case.
 */
export interface EvidenceItem {
    id: string;
    caseId: string;
    tenantId: string;
    filename: string;
    storagePath: string; // Firebase Storage reference
    uploadDate: string; // ISO Date
    
    // --- Metadata (Often populated by AI) ---
    category: EvidenceCategory;
    sourceAuthor?: string; // e.g. "Dr. Sarah Smith"
    sourceOrganization?: string; // e.g. "Leeds NHS Trust"
    documentDate?: string; // ISO Date of the actual letter/report
    
    extractionStatus: ExtractionStatus;
    
    // --- Validation ---
    isVerified: boolean; // Has a human confirmed the AI tagging?
}

/**
 * A detected entity from the text.
 */
export interface ExtractedStakeholder {
    name: string;
    role: 'parent' | 'senco' | 'social_worker' | 'pediatrician' | 'class_teacher' | 'unknown';
    email?: string;
    phone?: string;
    confidenceScore: number; // 0.0 to 1.0
}

/**
 * Critical dates found in the text.
 */
export interface DetectedDate {
    label: 'dob' | 'request_date' | 'incident_date' | 'assessment_date';
    dateIso: string;
    context: string; // "Found in header: DOB: 12/05/2015"
}

/**
 * The structured output from "The Clerk" (AI Agent).
 */
export interface IngestionAnalysis {
    fileId: string;
    
    // --- Entity Extraction ---
    extractedStakeholders: ExtractedStakeholder[];
    
    // --- Temporal Extraction ---
    detectedDates: DetectedDate[];
    
    // --- Classification ---
    suggestedCategory: EvidenceCategory;
    confidence: number;
    
    // --- Risk Analysis ---
    riskSignals: string[]; // e.g., ["Mention of tribunal appeal", "Reference to self-harm"]
    
    // --- Summary ---
    summary: string; // 2-3 sentence summary of the document
}
