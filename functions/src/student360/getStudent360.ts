import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from './audit/audit-logger';

// Type definitions to match client-side schema (simplified for server)
interface StudentRecord {
    id: string;
    tenantId: string;
    identity: {
        firstName: { value: string };
        lastName: { value: string };
        // ... other fields
    };
    meta: {
        privacyLevel: 'standard' | 'high' | 'restricted';
    };
    // ...
}

interface GetStudentRequest {
    studentId: string;
    reason?: string; // Optional reason for audit
}

// Export raw handler, NOT onCall wrapper
export const handler = async (request: CallableRequest<GetStudentRequest>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { studentId, reason } = request.data;
    const uid = request.auth.uid;
    const tenantId = request.auth.token.tenantId || 'default-tenant'; // Ideally from custom claim

    // 1. Fetch Student
    const studentRef = admin.firestore().collection('students').doc(studentId);
    const snapshot = await studentRef.get();

    if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Student not found.');
    }

    const studentData = snapshot.data() as StudentRecord;

    // 2. Tenant Check
    if (studentData.tenantId !== tenantId) {
        console.warn(`[SECURITY] Tenant mismatch access attempt by ${uid}`);
        throw new HttpsError('permission-denied', 'Unauthorized access.');
    }

    // 3. Role-Based Access Control (RBAC) & Field-Level Security
    const userRole = request.auth.token.role || 'ParentUser'; // Default to lowest priv
    
    // Check if user is authorized to view restricted records
    if (studentData.meta.privacyLevel === 'restricted' && !['SuperAdmin', 'EPP'].includes(userRole)) {
        await logAuditEvent({
            tenantId,
            action: 'read',
            resourceType: 'student',
            resourceId: studentId,
            actorId: uid,
            details: 'Access denied to restricted record',
            metadata: { reason }
        });
        throw new HttpsError('permission-denied', 'Access to restricted record denied.');
    }

    // 4. Redaction Logic (Server-side enforcement)
    // We clone and strip fields based on role
    const redactedData = redactDataForRole(studentData, userRole);

    // 5. Audit Log
    await logAuditEvent({
        tenantId,
        action: 'read',
        resourceType: 'student',
        resourceId: studentId,
        actorId: uid,
        details: 'Viewed Student 360 Record',
        metadata: { 
            reason, 
            redacted: Object.keys(studentData).length !== Object.keys(redactedData).length 
        }
    });

    return redactedData;
};


/**
 * Helper to strip sensitive fields based on role.
 * This ensures even if the client is compromised, the data never left the server.
 */
function redactDataForRole(data: any, role: string): any {
    const copy = JSON.parse(JSON.stringify(data));

    // Define restricted paths
    const restrictions: Record<string, string[]> = {
        'careHistory': ['EPP', 'SuperAdmin', 'GovAnalyst'],
        'discipline': ['EPP', 'SchoolAdmin', 'SuperAdmin'],
        'health': ['EPP', 'SchoolAdmin', 'SuperAdmin', 'ParentUser'], // Parents can see health
        'identity.nationalId': ['EPP', 'SuperAdmin', 'SchoolAdmin'],
    };

    // Apply Redaction
    if (!restrictions['careHistory'].includes(role)) delete copy.careHistory;
    if (!restrictions['discipline'].includes(role)) delete copy.discipline;
    
    // Partial redaction for nationalId (nested)
    if (!restrictions['identity.nationalId'].includes(role) && copy.identity?.nationalId) {
        copy.identity.nationalId.value = 'REDACTED';
    }

    return copy;
}
