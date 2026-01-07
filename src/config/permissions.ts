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
    | 'manage_users';

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
        'manage_users'
    ],
    TenantAdmin: [ // e.g. LEA / District Admin
        'manage_compliance_packs', 
        'view_staff_scr', 
        'edit_staff_scr',
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii',
        'manage_users'
    ],
    SchoolAdmin: [ // Headteacher / DSL
        'view_staff_scr', 
        'view_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii'
    ],
    EPP: [ // Educational Psychologist
        'view_psychometrics', 
        'write_psychometrics', 
        'view_sensitive_notes', 
        'view_student_pii'
    ],
    Assistant: [ // EPP Assistant / Trainee
        'view_psychometrics', 
        'write_psychometrics'
        // No sensitive notes view by default unless upgraded
    ],
    TrustedAssistant: [ // Verified Assistant
        'view_psychometrics', 
        'write_psychometrics',
        'view_sensitive_notes'
    ],
    ParentUser: [
        // Strictly limited scope
    ],
    GovAnalyst: [
        'view_gov_intel'
    ]
};
