import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from './audit/audit-logger';

// Standardized initialization check
if (!admin.apps.length) admin.initializeApp();

interface GetStudentRequest {
    studentId: string;
    reason?: string; 
}

export const handler = async (request: CallableRequest<GetStudentRequest>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { studentId, reason } = request.data;
    const uid = request.auth.uid;
    const userRole = (request.auth.token.role || 'ParentUser') as string;
    const userTenantId = (request.auth.token.tenantId || 'default-tenant') as string;

    console.log(`[Student360] Fetch attempt by ${uid} for student ${studentId} (Tenant: ${userTenantId})`);

    try {
        // 1. SELECT DATABASE
        // Using standard firestore instance for now to ensure connectivity
        const db = admin.firestore();

        // 2. FETCH STUDENT
        // Try Root Collection first
        let studentRef = db.collection('students').doc(studentId);
        let snapshot = await studentRef.get();

        // Fallback to Tenant-Nested Path if not found in root
        if (!snapshot.exists) {
            console.log(`[Student360] Not found in root, checking tenants/${userTenantId}/students...`);
            studentRef = db.collection('tenants').doc(userTenantId).collection('students').doc(studentId);
            snapshot = await studentRef.get();
        }

        if (!snapshot.exists) {
            throw new HttpsError('not-found', 'Student record not found.');
        }

        const studentData = snapshot.data();

        // 3. SECURITY CHECK
        const isSuperAdmin = ['SuperAdmin', 'Admin', 'admin'].includes(userRole);
        const recordTenantId = studentData?.tenantId || 'default-tenant';

        // Authorization Logic
        if (!isSuperAdmin) {
            if (recordTenantId !== userTenantId && recordTenantId !== 'default-tenant') {
                console.warn(`[SECURITY] Access Denied: Tenant Mismatch. User=${userTenantId}, Record=${recordTenantId}`);
                throw new HttpsError('permission-denied', 'Unauthorized access to this record.');
            }
        }

        // 4. Redaction Logic
        const redactedData = redactDataForRole(studentData, userRole);

        // 5. Audit Log
        await logAuditEvent({
            tenantId: recordTenantId,
            action: 'read',
            resourceType: 'student',
            resourceId: studentId,
            actorId: uid,
            details: 'Viewed Student 360 Record (Secure)',
            metadata: { reason }
        });

        return redactedData;

    } catch (error: any) {
        console.error(`[Student360] Error:`, error);
        // Map internal errors to secure HttpsErrors
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'Failed to process request.');
    }
};

function redactDataForRole(data: any, role: string): any {
    const copy = JSON.parse(JSON.stringify(data));
    
    // SuperAdmins bypass redaction
    if (['SuperAdmin', 'Admin', 'admin'].includes(role)) return copy;

    const restrictions: Record<string, string[]> = {
        'careHistory': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'SchoolPsychologist'],
        'discipline': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'SchoolPsychologist', 'SchoolAdmin'],
        'health': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'SchoolPsychologist', 'ParentUser'],
    };

    Object.keys(restrictions).forEach(path => {
        if (!restrictions[path].some(r => r.toLowerCase() === role.toLowerCase())) {
            delete copy[path];
        }
    });

    return copy;
}
