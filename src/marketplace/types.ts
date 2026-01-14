// src/marketplace/types.ts

import { PolicyRule } from "@/types/schema";

export type InstallActionType = 'createPolicyRule' | 'createTrainingModule' | 'createMapping' | 'createRolloutChecklist';

export interface InstallAction {
    type: InstallActionType;
    payload: any; // e.g. PolicyRule sans ID
}

export interface SchemaExtensionField {
    fieldName: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array';
    options?: string[]; // For enums
    validationRegex?: string;
    required: boolean;
    encrypt: boolean;
    description?: string;
}

export interface ComplianceWorkflow {
    id: string;
    name: string;
    trigger: string; // e.g. 'attendance_logged', 'schedule_daily'
    target?: string; // e.g., 'StaffProfile'
    condition: string; // e.g. 'status == unexplained'
    action: string; // e.g. 'create_case', 'notify_dsl'
    slaHours?: number;
    payload?: Record<string, any>;
}

export interface PsychometricConfig {
    standardScoreMean: number;
    standardScoreSD: number;
    deviationThresholds: {
        mild: number; // e.g. 1.0 SD (85)
        significant: number; // e.g. 2.0 SD (70)
    };
    confidenceInterval: number; // e.g. 95
    discrepancySignificance: number;
}

export interface StatutoryReportTemplate {
    id: string;
    name: string; // e.g. 'EHCP Needs Assessment'
    sections: {
        id: string;
        title: string;
        promptId: string; // Link to system prompt
    }[];
    constraints?: string[];
}

export interface ConsultationTemplate {
    id: string;
    title: string;
    description: string;
    system_prompt: string;
    required_sections: string[];
    tags: string[];
}

// Phase 10: Intervention Logic Type
export interface InterventionLogic {
    id: string;
    domain: string; // e.g. 'VCI', 'WMI'
    threshold: number; // Score below which this triggers
    programName: string;
    description: string;
    evidenceLevel?: 'gold' | 'silver' | 'bronze'; // Optional evidence rating
}

export interface CountryPackConfig {
    countryCode: string; // 'UK', 'US', 'SA'
    schemaExtensions: {
        student: SchemaExtensionField[];
        school: SchemaExtensionField[];
        staff?: SchemaExtensionField[]; 
    };
    complianceWorkflows: ComplianceWorkflow[];
    psychometricConfig: PsychometricConfig;
    statutoryReports: StatutoryReportTemplate[];
    interventionLogic?: InterventionLogic[]; 
    consultationTemplates?: ConsultationTemplate[];
    digitalForms?: any[]; // Added in Phase 29
    // Metadata for Update Checking
    provisionBankRef?: string;
}

export interface MarketplaceManifest {
    id: string;
    name: string;
    description: string;
    version: string; // e.g. "1.0.0"
    releaseDate?: string; // e.g. "2024-01-01"
    changelog?: string; // e.g. "Added 2026 Attendance Codes"
    
    // Commercial Fields (Phase 39)
    price?: number; // Base Monthly Fee
    stripePriceId?: string; // Stripe Subscription ID
    stripeMeteredPriceId?: string; // Optional: For usage-based overage
    trialDays?: number; // e.g. 14
    currency?: string; // 'GBP' | 'USD'

    regionTags: string[];
    actions: InstallAction[];
    capabilities?: CountryPackConfig;
}
