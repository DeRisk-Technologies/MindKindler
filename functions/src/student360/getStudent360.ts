import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { logAuditEvent } from './audit/audit-logger';

if (!admin.apps.length) admin.initializeApp();

export const handler = async (request: CallableRequest<any>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { studentId, reason } = request.data;
    const uid = request.auth.uid;
    const userRole = (request.auth.token.role || 'ParentUser') as string;
    const userTenantId = (request.auth.token.tenantId || 'default-tenant') as string;

    try {
        const db = admin.firestore();
        let studentRef = db.collection('students').doc(studentId);
        let snapshot = await studentRef.get();

        if (!snapshot.exists) {
            studentRef = db.collection('tenants').doc(userTenantId).collection('students').doc(studentId);
            snapshot = await studentRef.get();
        }

        if (!snapshot.exists) {
            throw new HttpsError('not-found', 'Student record not found.');
        }

        const rawData = snapshot.data() || {};
        
        // --- DATA NORMALIZATION (Legacy -> Enterprise) ---
        // If 'identity' is missing, it's a legacy record. We wrap it for the UI.
        const normalizedData: any = {
            id: snapshot.id,
            tenantId: rawData.tenantId || 'default-tenant',
            meta: rawData.meta || {
                trustScore: 100,
                privacyLevel: 'standard',
                createdAt: rawData.createdAt || new Date().toISOString()
            },
            identity: rawData.identity || {
                firstName: { value: rawData.firstName || "Unknown", metadata: { source: 'manual', verified: true } },
                lastName: { value: rawData.lastName || "Student", metadata: { source: 'manual', verified: true } },
                dateOfBirth: { value: rawData.dateOfBirth || "Unknown", metadata: { source: 'manual', verified: true } },
                gender: { value: rawData.gender || "Unknown", metadata: { source: 'manual', verified: true } },
                nationalId: { value: rawData.nationalId || "", metadata: { source: 'manual', verified: false } }
            },
            education: rawData.education || {
                currentSchoolId: { value: rawData.schoolId || "Unknown", metadata: { source: 'manual', verified: true } },
                attendancePercentage: { value: 100, metadata: { source: 'manual', verified: false } }
            },
            family: rawData.family || {
                parents: rawData.parentId ? [{ id: rawData.parentId, firstName: 'Parent', lastName: 'Record', relationshipType: 'Guardian' }] : []
            },
            health: rawData.health || {
                allergies: { value: rawData.needs || [] },
                conditions: { value: rawData.diagnosisCategory || [] },
                medications: { value: [] }
            },
            discipline: rawData.discipline || (rawData.alerts || []).map((a: any) => ({
                id: a.id || Math.random().toString(),
                type: a.type || 'Alert',
                severity: a.severity || 'low',
                description: a.title || ''
            }))
        };

        // 2. SECURITY CHECK (Post-Normalization)
        const isSuperAdmin = ['SuperAdmin', 'Admin', 'admin'].includes(userRole);
        if (!isSuperAdmin && normalizedData.tenantId !== userTenantId && normalizedData.tenantId !== 'default-tenant') {
            throw new HttpsError('permission-denied', 'Unauthorized access.');
        }

        // 3. Redaction Logic
        const redactedData = redactDataForRole(normalizedData, userRole);

        // 4. Audit Log
        await logAuditEvent({
            tenantId: normalizedData.tenantId,
            action: 'read',
            resourceType: 'student',
            resourceId: studentId,
            actorId: uid,
            details: 'Viewed Student Record (Normalized)',
            metadata: { reason }
        });

        return redactedData;

    } catch (error: any) {
        console.error(`[Student360] Error:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message);
    }
};

function redactDataForRole(data: any, role: string): any {
    const copy = JSON.parse(JSON.stringify(data));
    if (['SuperAdmin', 'Admin', 'admin'].includes(role)) return copy;

    const restrictions: Record<string, string[]> = {
        'careHistory': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist'],
        'discipline': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'SchoolAdmin'],
        'health': ['EPP', 'EducationalPsychologist', 'ClinicalPsychologist', 'ParentUser'],
    };

    Object.keys(restrictions).forEach(path => {
        if (!restrictions[path].some(r => r.toLowerCase() === role.toLowerCase())) {
            delete copy[path];
        }
    });

    return copy;
}
