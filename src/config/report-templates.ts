// src/config/report-templates.ts

import { StatutoryReportTemplate } from '@/marketplace/types';

/**
 * STANDARD UK EPP TEMPLATES
 * Based on the SEND Code of Practice (2015) and standard LA Appendix D requirements.
 */

export const UK_EPP_TEMPLATES: StatutoryReportTemplate[] = [
    {
        id: "statutory_advice_appendix_d",
        name: "Statutory Psychological Advice (Appendix D)",
        description: "Formal advice for an EHC Needs Assessment (Children and Families Act 2014, s.36).",
        sections: [
            { 
                id: "background", 
                title: "1. Background & Sources of Information", 
                promptId: "uk_appendix_d_background",
                placeholder: "List sources (e.g. observation date, consultation with parent 12/01/24)..." 
            },
            { 
                id: "views", 
                title: "2. Views, Interests and Aspirations (Section A)", 
                promptId: "uk_appendix_d_views",
                placeholder: "Capture the voice of the child and family..."
            },
            { 
                id: "cognition_learning", 
                title: "3. Cognition and Learning (Section B)", 
                promptId: "uk_appendix_d_cog",
                placeholder: "Psychometric scores, attainment data, learning style..."
            },
            { 
                id: "communication_interaction", 
                title: "4. Communication and Interaction (Section B)", 
                promptId: "uk_appendix_d_comms" 
            },
            { 
                id: "semh", 
                title: "5. Social, Emotional and Mental Health (Section B)", 
                promptId: "uk_appendix_d_semh" 
            },
            { 
                id: "physical_sensory", 
                title: "6. Sensory and/or Physical Needs (Section B)", 
                promptId: "uk_appendix_d_sensory" 
            },
            { 
                id: "outcomes", 
                title: "7. Recommended Outcomes (Section E)", 
                promptId: "uk_appendix_d_outcomes",
                placeholder: "SMART outcomes to be achieved by end of Key Stage..."
            },
            { 
                id: "provision", 
                title: "8. Recommended Provision (Section F)", 
                promptId: "uk_appendix_d_provision",
                placeholder: "Specific, Quantified, and Detailed support required..."
            }
        ],
        constraints: ["no_medical_diagnosis", "use_tentative_language", "statutory_compliance"]
    },
    {
        id: "intervention_plan",
        name: "Special Education Intervention Plan",
        description: "A structured table of interventions, baselines, and review criteria.",
        sections: [
            { 
                id: "baseline_assessment", 
                title: "Current Baseline", 
                promptId: "intervention_baseline",
                placeholder: "Current scores (e.g. BPVS, Boxall Profile)..."
            },
            { 
                id: "intervention_strategy", 
                title: "Intervention Strategy", 
                promptId: "intervention_strategy",
                placeholder: "Description of the evidence-based program (e.g. Precision Teaching)..."
            },
            { 
                id: "delivery_mechanics", 
                title: "Delivery Mechanics", 
                promptId: "intervention_mechanics",
                placeholder: "Staff ratio (1:1), Frequency (3x weekly), Duration (20 mins)..."
            },
            { 
                id: "success_criteria", 
                title: "Success Criteria & Review", 
                promptId: "intervention_review",
                placeholder: "How will progress be measured? When is the review date?"
            }
        ],
        constraints: ["smart_targets", "measurable_outcomes"]
    }
];
