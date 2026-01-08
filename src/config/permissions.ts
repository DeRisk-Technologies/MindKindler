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
    | 'manage_practice_tenants'
    | 'manage_client_schools'
    | 'access_marketplace'
    | 'access_community'
    | 'manage_data_ingestion'; // New for Data Ops

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
        'manage_practice_tenants',
        'manage_client_schools',
        'access_marketplace',
        'access_community',
        'manage_data_ingestion'
    ],
    TenantAdmin: [ // e.g. LEA or EPP Practice Owner
        'manage_compliance_packs', 
        'view_staff_scr', 
        'edit_staff_scr',
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'manage_users',
        'manage_client_schools',
        'access_marketplace',
        'access_community',
        'manage_data_ingestion'
    ],
    SchoolAdmin: [ // Headteacher / DSL
        'view_staff_scr', 
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'access_community'
    ],
    EPP: [ // Educational Psychologist
        'view_psychometrics', 
        'write_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'manage_client_schools', 
        'access_marketplace',
        'access_community',
        'view_gov_intel', // Intelligence access
        'manage_data_ingestion', // Ability to import student lists
        'view_staff_scr', // Added for Pilot: EPPs need to check staff credentials (SCR)
        'edit_staff_scr'  // Added for Pilot: EPPs managing their own practice staff
    ],
    Assistant: [ 
        'view_psychometrics', 
        'write_psychometrics',
        'manage_data_ingestion'
    ],
    TrustedAssistant: [ 
        'view_psychometrics', 
        'write_psychometrics',
        'view_sensitive_notes',
        'manage_data_ingestion'
    ],
    ParentUser: [
        'access_community'
    ],
    GovAnalyst: [
        'view_gov_intel'
    ]
};
