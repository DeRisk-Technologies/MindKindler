// src/config/permissions.ts

import { Role } from "@/types/schema";

export type PermissionAction = 
    | 'view_gov_intel' 
    | 'manage_compliance_packs'
    | 'view_staff_scr'
    | 'edit_staff_scr'
    | 'view_psychometrics'
    | 'write_psychometrics'
    | 'view_sensitive_notes'
    | 'view_student_pii'
    | 'manage_users'
    | 'manage_data_ingestion' // NEW
    | 'access_community'      // NEW
    | 'access_marketplace'    // NEW
    | 'access_training'       // NEW
    | 'manage_practice'       // NEW (Manage own schools/partners)
    | 'assign_tasks'          // NEW (Delegate to assistants)
    | 'view_team_tasks'       // NEW (Monitor assistants)
    | 'access_consultations'  // NEW (Live transcription, AI suggestions)
    | 'create_assessments';   // NEW (AI Assessment Creator)

type RolePermissions = Record<Role, PermissionAction[]>;

export const RBAC_MATRIX: RolePermissions = {
    SuperAdmin: [
        'view_gov_intel', 
        'manage_compliance_packs', 
        'view_staff_scr', 
        'edit_staff_scr',
        'view_psychometrics', 
        'write_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'manage_users',
        'manage_data_ingestion',
        'access_community',
        'access_marketplace',
        'access_training',
        'manage_practice',
        'assign_tasks',
        'view_team_tasks',
        'access_consultations',
        'create_assessments'
    ],
    TenantAdmin: [ // e.g. LEA / District Admin OR Independent EPP Practice Lead
        'manage_compliance_packs', 
        'view_staff_scr', 
        'edit_staff_scr',
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'manage_users',
        'manage_data_ingestion',
        'access_community',
        'access_marketplace',
        'access_training',
        'manage_practice',
        'assign_tasks',
        'view_team_tasks',
        'access_consultations',
        'create_assessments'
    ],
    SchoolAdmin: [ // Headteacher / DSL
        'view_staff_scr', 
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'access_training',
        'access_community'
    ],
    EPP: [ // Educational Psychologist (Employee or Independent)
        'view_psychometrics', 
        'write_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'view_gov_intel',          
        'manage_data_ingestion',   
        'access_community',        
        'access_marketplace',      
        'access_training',         
        'assign_tasks',            
        'view_team_tasks',
        'access_consultations', // ADDED: Core feature
        'create_assessments'    // ADDED: AI Creator
    ],
    EducationalPsychologist: [ // ALIAS for EPP
        'view_psychometrics', 
        'write_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'view_gov_intel',
        'manage_data_ingestion',
        'access_community',
        'access_marketplace',
        'access_training',
        'assign_tasks',
        'view_team_tasks',
        'access_consultations', // ADDED
        'create_assessments'    // ADDED
    ],
    Assistant: [ // EPP Assistant / Trainee
        'view_psychometrics', 
        'write_psychometrics',
        'access_training',
        'manage_data_ingestion', 
        'access_community',
        'access_consultations' // Assistants often scribe/record
    ],
    TrustedAssistant: [ // Verified Assistant
        'view_psychometrics', 
        'write_psychometrics',
        'view_sensitive_notes',
        'access_training',
        'manage_data_ingestion',
        'access_community',
        'access_consultations'
    ],
    ParentUser: [
        // Strictly limited scope
        'access_community'
    ],
    GovAnalyst: [
        'view_gov_intel'
    ]
};
