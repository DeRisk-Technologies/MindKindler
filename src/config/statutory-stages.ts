export type StatutoryStageId = 'intake' | 'assessment' | 'drafting' | 'consultation' | 'final';

export type StatutoryToolId = 
    | 'file_uploader' 
    | 'clerk_agent'
    | 'observation_mode'
    | 'card_sort_app'
    | 'assessment_builder'
    | 'report_editor'
    | 'consultation_cockpit'
    | 'final_signoff';

export interface StatutoryStageConfig {
    id: StatutoryStageId;
    label: string;
    description: string;
    
    // Timeline constraints (in Weeks from Request Date)
    weekStart: number;
    weekEnd: number;
    
    // UI Configuration
    requiredTools: StatutoryToolId[];
    color: string; // Tailwind class prefix or hex
    
    // Logic
    exitCriteria: string;
    criticalDeliverables: string[];
}

/**
 * SOURCE OF TRUTH for the 20-Week EHCP Workflow.
 * Defines what happens when, and what tools are available.
 */
export const EHCP_STAGES: StatutoryStageConfig[] = [
    {
        id: 'intake',
        label: 'Intake & Decision',
        description: 'Local Authority receives request and decides whether to assess.',
        weekStart: 0,
        weekEnd: 6,
        requiredTools: ['file_uploader', 'clerk_agent'],
        color: 'blue',
        exitCriteria: 'LA issues "Decision to Assess" letter.',
        criticalDeliverables: ['Decision Letter', 'Basic Case Metadata']
    },
    {
        id: 'assessment',
        label: 'Evidence Gathering',
        description: 'The "Active Zone". Professionals conduct assessments and gather advice.',
        weekStart: 6,
        weekEnd: 12,
        requiredTools: ['observation_mode', 'card_sort_app', 'assessment_builder'],
        color: 'indigo',
        exitCriteria: 'All statutory advice (Section A-K) collected and gaps closed.',
        criticalDeliverables: ['Parent Advice (Sec A)', 'School Advice (Sec B)', 'Medical Advice (Sec C)', 'EP Advice (Sec D)', 'Social Care Advice (Sec H)']
    },
    {
        id: 'drafting',
        label: 'Drafting & Synthesis',
        description: 'EP synthesizes evidence into the Draft EHC Plan.',
        weekStart: 12,
        weekEnd: 16,
        requiredTools: ['report_editor', 'consultation_cockpit'],
        color: 'purple',
        exitCriteria: 'Draft Plan issued to parents for comment.',
        criticalDeliverables: ['Draft EHC Plan']
    },
    {
        id: 'consultation',
        label: 'Consultation',
        description: '15-day statutory window for parents/schools to review the Draft.',
        weekStart: 16,
        weekEnd: 19, // Technically finishes just before week 20
        requiredTools: ['consultation_cockpit'],
        color: 'orange',
        exitCriteria: 'Consultation period ends; final amendments agreed.',
        criticalDeliverables: ['Consultation Response Log']
    },
    {
        id: 'final',
        label: 'Finalization',
        description: 'Issue Final EHC Plan.',
        weekStart: 19,
        weekEnd: 20,
        requiredTools: ['final_signoff'],
        color: 'green',
        exitCriteria: 'Final Plan signed and issued.',
        criticalDeliverables: ['Final EHC Plan']
    }
];
