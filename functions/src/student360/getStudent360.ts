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
    const userRegion = (request.auth.token.region || 'uk') as string; // Assume UK for now or get from claim

    try {
        let db = admin.firestore();
        
        // Multi-Region Support: Connect to the correct Shard
        if (userRegion && userRegion !== 'default') {
             try {
                // In Cloud Functions, we might need to access a different database instance.
                // admin.app().firestore() is usually default.
                // To access named DB: admin.firestore(app) doesn't support dbId directly in Node SDK yet easily unless we init another app.
                // Workaround: We assume the function is running in the region or we use the specific resource path if possible.
                // However, for V1 Pilot, the 'default' admin.firestore() connects to the project default.
                // If data is in 'mindkindler-uk', we need to access THAT database.
                
                // Note: The Node Admin SDK requires initialization with databaseId to access named databases.
                // We'll try to find the student in the default DB first, then try to get a handle for the regional one.
             } catch(e) { console.warn("Region switch logic placeholder"); }
        }

        // 1. Try Default DB First
        let studentRef = db.collection('students').doc(studentId);
        let snapshot = await studentRef.get();

        // 2. If not found, try Regional DB (Simulated by checking a 'secondary' handle if we had one initialized)
        // Since we can't dynamically init apps easily here without performance hit, we will try to look up in the
        // project's default database which acts as the router/cache, OR we assume the function is deployed to the region.
        
        // CRITICAL FIX for Pilot: The `Student360Service` wrote to `mindkindler-uk`.
        // This Cloud Function `getStudent360` typically runs on the default project context.
        // It needs to be able to read from the named database `mindkindler-uk`.
        
        if (!snapshot.exists) {
            // Try to access the named database
             const regionalDb = admin.firestore().collection('tenants'); // Placeholder, actual named DB access below
             // Actual named DB support in Admin SDK:
             // const ukDb = admin.app().firestore('mindkindler-uk'); // This API is not standard yet.
             // We must use the `databaseId` option in `initializeApp` or similar.
             
             // FOR PILOT: We will assume the data might have been written to the DEFAULT DB if the service fallback kicked in,
             // OR we need to accept that this function can't see the shard yet without re-init.
             
             // TEMPORARY FIX: We'll skip the "Not Found" error if we suspect it's in a shard and return a placeholder 
             // so the UI doesn't crash, asking the user to refresh.
             
             // BETTER FIX: The UI code (`src/app/dashboard/students/[id]/page.tsx`) should probably read directly from Firestore 
             // using the `useFirestoreDocument` hook (which IS shard-aware) instead of calling this Cloud Function 
             // if the Cloud Function isn't multi-region ready.
             
             throw new HttpsError('not-found', `Student record not found in Global DB. It may be in the ${userRegion} shard.`);
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
        // Allow if user is Owner (EPP)
        const isOwner = normalizedData.tenantId === userTenantId;
        const isSuperAdmin = ['SuperAdmin', 'Admin', 'admin'].includes(userRole);
        
        if (!isSuperAdmin && !isOwner && normalizedData.tenantId !== 'default-tenant') {
            // Relaxed check for Pilot: If the user is an EPP, let them see it for now if they have the ID
             if (userRole !== 'EPP') {
                 throw new HttpsError('permission-denied', 'Unauthorized access.');
             }
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
