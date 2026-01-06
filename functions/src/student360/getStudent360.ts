import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from './audit/audit-logger';

// Type definitions
interface StudentRecord {
    id: string;
    tenantId?: string; 
    identity: {
        firstName: { value: string };
        lastName: { value: string };
    };
    meta: {
        privacyLevel: 'standard' | 'high' | 'restricted';
    };
}

interface GetStudentRequest {
    studentId: string;
    reason?: string; 
    region?: string; // Optional: tell the function which shard to look in
}

export const handler = async (request: CallableRequest<GetStudentRequest>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { studentId, reason, region } = request.data;
    const uid = request.auth.uid;
    const userRole = (request.auth.token.role || 'ParentUser') as string;
    const userTenantId = (request.auth.token.tenantId || 'default-tenant') as string;

    // 1. SELECT DATABASE
    // If a region is provided, connect to that shard. Otherwise, fallback to default.
    let db = admin.firestore();
    if (region && region !== 'global' && region !== 'europe-west3') {
        // Note: For multi-db in Admin SDK, we use the specific database ID
        // In some environments, this requires initialized secondary apps, 
        // but modern admin SDK supports .databaseId()
        try {
            // @ts-ignore - databaseId is supported in newer admin SDKs
            db = admin.firestore(region); 
        } catch (e) {
            console.error(`Failed to connect to shard ${region}, using default.`);
        }
    }

    // 2. FETCH STUDENT
    // We check the root 'students' collection (Legacy) AND the 'tenants' path (Enterprise)
    let studentRef = db.collection('students').doc(studentId);
    let snapshot = await studentRef.get();

    // If not found in root, check enterprise path
    if (!snapshot.exists) {
        studentRef = db.collection('tenants').doc(userTenantId).collection('students').doc(studentId);
        snapshot = await studentRef.get();
    }

    if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Student record not found in this region.');
    }

    const studentData = snapshot.data() as StudentRecord;

    // 3. SECURITY CHECK
    const isSuperAdmin = ['SuperAdmin', 'Admin', 'admin'].includes(userRole);
    
    // Logic: 
    // - SuperAdmins see everything.
    // - For others: must match tenantId. 
    // - If record has NO tenantId (legacy), we allow it for now if they are a clinician.
    const recordTenantId = studentData.tenantId || 'default-tenant';
    const isClinician = ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'SchoolPsychologist', 'TenantAdmin'].includes(userRole);

    if (!isSuperAdmin) {
        if (recordTenantId !== userTenantId && recordTenantId !== 'default-tenant') {
             throw new HttpsError('permission-denied', 'You do not have access to this student record.');
        }
        if (!isClinician) {
             throw new HttpsError('permission-denied', 'Clinical access required.');
        }
    }

    // 4. RBAC Check for Restricted Records
    if (studentData.meta?.privacyLevel === 'restricted' && !['SuperAdmin', 'EPP', 'EducationalPsychologist'].includes(userRole)) {
        throw new HttpsError('permission-denied', 'Access to restricted record denied.');
    }

    // 5. Redaction & Audit
    const redactedData = redactDataForRole(studentData, userRole);

    await logAuditEvent({
        tenantId: recordTenantId,
        action: 'read',
        resourceType: 'student',
        resourceId: studentId,
        actorId: uid,
        details: 'Viewed Student 360 Record',
        metadata: { reason, database: region || 'default' }
    });

    return redactedData;
};

function redactDataForRole(data: any, role: string): any {
    const copy = JSON.parse(JSON.stringify(data));
    const restrictions: Record<string, string[]> = {
        'careHistory': ['EPP', 'EducationalPsychologist', 'SuperAdmin', 'GovAnalyst'],
        'discipline': ['EPP', 'EducationalPsychologist', 'SchoolAdmin', 'SuperAdmin', 'TenantAdmin'],
        'health': ['EPP', 'EducationalPsychologist', 'SchoolAdmin', 'SuperAdmin', 'ParentUser', 'TenantAdmin'],
        'identity.nationalId': ['EPP', 'EducationalPsychologist', 'SuperAdmin', 'SchoolAdmin', 'TenantAdmin'],
    };

    const rolesWithFullAccess = ['SuperAdmin', 'Admin', 'admin'];
    if (rolesWithFullAccess.includes(role)) return copy;

    Object.keys(restrictions).forEach(path => {
        if (!restrictions[path].includes(role)) {
            if (path.includes('.')) {
                // Handle nested PII like identity.nationalId
                const [parent, child] = path.split('.');
                if (copy[parent] && copy[parent][child]) copy[parent][child].value = 'REDACTED';
            } else {
                delete copy[path];
            }
        }
    });

    return copy;
}
