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
    | 'view_team_tasks';      // NEW (Monitor assistants)

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
        'view_team_tasks'
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
        'view_team_tasks'
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
        'view_gov_intel',          // Added
        'manage_data_ingestion',   // Added (Import CSVs from schools)
        'access_community',        // Added
        'access_marketplace',      // Added
        'access_training',         // Added
        'assign_tasks',            // Added
        'view_team_tasks'          // Added
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
        'view_team_tasks'
    ],
    Assistant: [ // EPP Assistant / Trainee
        'view_psychometrics', 
        'write_psychometrics',
        'access_training',
        'manage_data_ingestion', // Assistants often do the import
        'access_community'
        // No sensitive notes view by default unless upgraded
    ],
    TrustedAssistant: [ // Verified Assistant
        'view_psychometrics', 
        'write_psychometrics',
        'view_sensitive_notes',
        'access_training',
        'manage_data_ingestion',
        'access_community'
    ],
    ParentUser: [
        // Strictly limited scope
        'access_community' // Maybe read-only public parts?
    ],
    GovAnalyst: [
        'view_gov_intel'
    ]
};
