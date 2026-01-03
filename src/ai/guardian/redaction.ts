// src/ai/guardian/redaction.ts

import { StudentRecord, Role, RedactionLevel, ConsentRecord } from '@/types/schema';

/**
 * Access Control Service for Student 360 Data.
 * Determines what fields a user can see based on their Role and the Privacy Level.
 */

// Define restricted paths and allowed roles
const RESTRICTED_FIELDS: Record<string, Role[]> = {
    'careHistory': ['EPP', 'SuperAdmin', 'GovAnalyst'], // Foster history sensitive
    'discipline': ['EPP', 'SchoolAdmin', 'SuperAdmin'], // Discipline details
    'health': ['EPP', 'SchoolAdmin', 'SuperAdmin', 'ParentUser'], // Health info
    'identity.nationalId': ['EPP', 'SuperAdmin', 'SchoolAdmin'], // PII
    'meta.privacyLevel': ['SuperAdmin', 'TenantAdmin'],
};

/**
 * Applies redaction to a student record based on the user's role and requested redaction level.
 */
export function redactStudentRecord(
    record: StudentRecord, 
    userRole: Role, 
    consents: ConsentRecord[] = [], // Pass consents to check sharing rules
    redactionLevel: RedactionLevel = 'FULL'
): Partial<StudentRecord> {
    // Deep clone to avoid mutating original
    const redacted = JSON.parse(JSON.stringify(record));

    // 1. Check Record-Level Privacy
    // If privacyLevel is 'high' or 'restricted', non-admins get very limited view
    if (record.meta?.privacyLevel === 'restricted' && !['SuperAdmin', 'EPP'].includes(userRole)) {
        return {
            id: record.id,
            tenantId: record.tenantId,
            meta: { ...record.meta, privacyLevel: 'restricted' } // Return almost nothing
        };
    }

    // 2. Field-Level Redaction
    // Traverse helper (simplified for flattened paths in this example, real impl needs recursion)
    
    // Logic for specific sections
    if (!hasAccess(userRole, 'careHistory')) {
        delete redacted.careHistory;
    }
    
    if (!hasAccess(userRole, 'discipline')) {
        delete redacted.discipline;
    }

    if (!hasAccess(userRole, 'health')) {
        delete redacted.health;
    }
    
    if (!hasAccess(userRole, 'identity.nationalId')) {
        if (redacted.identity?.nationalId) {
            redacted.identity.nationalId.value = 'REDACTED';
        }
    }

    // 3. Apply explicit Redaction Level (e.g., for exporting to a parent)
    if (redactionLevel === 'ANONYMIZED') {
        if (redacted.identity) {
            redacted.identity.firstName = { value: 'Student', metadata: { source: 'system', verified: true } };
            redacted.identity.lastName = { value: record.id.substring(0, 4), metadata: { source: 'system', verified: true } };
            delete redacted.identity.dateOfBirth;
            delete redacted.identity.nationalId;
        }
        delete redacted.family;
        delete redacted.careHistory;
        delete redacted.address;
    } else if (redactionLevel === 'PARENT_SAFE') {
        // Remove internal notes
        // Remove other students involved in discipline
        if (redacted.discipline) {
            redacted.discipline = redacted.discipline.map((d: any) => ({
                ...d,
                involvedParties: [], // Hide other kids
                metadata: { ...d.metadata, verifiedBy: 'REDACTED' } // Hide staff names if needed
            }));
        }
    }

    // 4. Consent-Based Redaction (Example: External Sharing)
    // If sharing with a 3rd party (userRole = 'GovAnalyst' or similar external), check consent
    if (userRole === 'GovAnalyst') {
        const eduConsent = consents.find(c => c.category === 'education_share' && c.status === 'granted');
        if (!eduConsent) {
            delete redacted.education; // Block education data if no consent
        }
    }

    return redacted;
}

function hasAccess(role: Role, fieldPath: string): boolean {
    const allowed = RESTRICTED_FIELDS[fieldPath];
    if (!allowed) return true; // Default allow if not listed
    return allowed.includes(role);
}
