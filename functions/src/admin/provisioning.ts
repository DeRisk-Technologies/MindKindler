// functions/src/admin/provisioning.ts
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { faker } from '@faker-js/faker';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * PHASE 32: Unified Provisioning Engine
 * Handles both Seeding (Onboarding) and Clearing (Reset).
 */
export const provisionTenantDataHandler = async (request: CallableRequest) => {
    // 1. Auth Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { role, tenantId: userTenantId, region: userRegion } = request.auth.token;
    const { targetTenantId, action, confirmation } = request.data; 
    // action: 'seed_pilot_uk' | 'clear_all'

    let finalTenantId = userTenantId;

    // 2. Security: Target Validation
    if (targetTenantId) {
        // Strict: Only Super Admin OR Tenant Admin targeting their own tenant
        const isSelfTarget = targetTenantId === userTenantId;
        const isSuper = role === 'super_admin';
        
        if (!isSuper && !isSelfTarget) {
             throw new HttpsError('permission-denied', 'Permission denied. Cannot provision other tenants.');
        }
        finalTenantId = targetTenantId;
    }

    if (!finalTenantId || finalTenantId === 'default') {
        throw new HttpsError('failed-precondition', 'No valid tenant ID found.');
    }

    // 3. Resolve Database (Regional Sharding)
    // We default to 'uk' if region is missing, or respect the user's region.
    // In a real multi-region app, we might lookup tenant region config.
    const region = userRegion || 'uk';
    const shardId = `mindkindler-${region}`;
    const targetDb = region === 'default' ? admin.firestore() : getFirestore(admin.app(), shardId);

    console.log(`[Provisioning] Action: ${action} | Tenant: ${finalTenantId} | Region: ${region}`);

    // 4. Execution Router
    if (action === 'seed_pilot_uk') {
        return await handleSeeding(targetDb, finalTenantId);
    } else if (action === 'clear_all') {
        if (confirmation !== true) {
            throw new HttpsError('invalid-argument', 'Confirmation flag required to clear data.');
        }
        return await handleClearing(targetDb, finalTenantId);
    } else {
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
};

async function handleSeeding(db: FirebaseFirestore.Firestore, tenantId: string) {
    // Safety: Check Count
    const existingSnap = await db.collection('students')
        .where('tenantId', '==', tenantId)
        .limit(6)
        .get();
    
    if (existingSnap.size > 5) {
        throw new HttpsError('already-exists', 'Tenant is already active (>5 students). Cannot seed data.');
    }

    const batch = db.batch();
    const prefix = tenantId; // Prefix IDs to prevent collisions in shared shards

    // --- STUDENT 1: CHARLIE COMPLEX ---
    for (let i = 0; i < 2; i++) {
        const id = `${prefix}_charlie_${i}`;
        const studentRef = db.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Charlie", metadata: { verified: true } },
                lastName: { value: `Complex ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2015-05-12", metadata: { verified: true } },
                gender: { value: "Male", metadata: {} }
            },
            education: {
                currentSchoolId: { value: "Pilot Primary", metadata: {} },
                senStatus: { value: "E", metadata: {} }, 
                yearGroup: { value: "Year 4", metadata: {} }
            },
            extensions: { uk_upn: `H${faker.number.int({ min: 100000000000, max: 999999999999 })}` },
            health: { conditions: { value: ["Dyslexia", "Anxiety"], metadata: { verified: true } }, allergies: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            family: { parents: [] },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        const caseRef = db.collection("cases").doc(`${prefix}_case_charlie_${i}`);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (18 * 7)); 

        batch.set(caseRef, {
            id: caseRef.id,
            tenantId,
            type: 'student',
            subjectId: id,
            title: "Statutory Assessment (Breach Risk)",
            status: 'active',
            priority: 'Critical',
            createdAt: startDate.toISOString(),
            slaDueAt: new Date().toISOString()
        });

        const psychRef = db.collection("assessment_results").doc(`${prefix}_wisc_charlie_${i}`);
        batch.set(psychRef, {
            id: psychRef.id,
            studentId: id,
            templateId: "WISC-V",
            totalScore: 72,
            responses: { "VCI": 95, "WMI": 72, "PSI": 88 },
            completedAt: new Date().toISOString(),
            status: "graded"
        });
    }

    // --- STUDENT 2: SAMMY SIMPLE ---
    for (let i = 0; i < 2; i++) {
        const id = `${prefix}_sammy_${i}`;
        const studentRef = db.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Sammy", metadata: { verified: true } },
                lastName: { value: `Simple ${i+1}`, metadata: { verified: true } },
                dateOfBirth: { value: "2018-09-01", metadata: { verified: true } }
            },
            education: {
                currentSchoolId: { value: "Pilot Primary", metadata: {} },
                senStatus: { value: "K", metadata: {} }
            },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });
    }

    // --- STUDENT 3: RILEY REVIEW ---
    for (let i = 0; i < 2; i++) {
        const id = `${prefix}_review_${i}`;
        const studentRef = db.collection("students").doc(id);
        
        batch.set(studentRef, {
            id,
            tenantId,
            isSeed: true,
            identity: {
                firstName: { value: "Riley", metadata: { verified: true } },
                lastName: { value: `Review ${i+1}`, metadata: { verified: true } }
            },
            education: { senStatus: { value: "E", metadata: {} } },
            meta: { createdAt: new Date().toISOString(), trustScore: 100 }
        });

        const reportRef = db.collection("reports").doc(`${prefix}_report_review_${i}`);
        batch.set(reportRef, {
            id: reportRef.id,
            tenantId,
            studentId: id,
            title: "Appendix K (Draft)",
            status: "pending_review",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: { sections: [{ id: "s1", title: "Section A", content: "Draft content." }] }
        });
    }

    await batch.commit();
    return { success: true, message: "Pilot data seeded successfully." };
}

async function handleClearing(db: FirebaseFirestore.Firestore, tenantId: string) {
    const batch = db.batch();
    let count = 0;

    // Collections to clear
    const collections = ['students', 'cases', 'reports', 'consultation_sessions', 'assessment_results'];
    
    for (const col of collections) {
        const snap = await db.collection(col)
            .where('tenantId', '==', tenantId)
            .where('isSeed', '==', true) 
            .limit(500)
            .get();
        
        snap.docs.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });
    }

    if (count > 0) await batch.commit();
    return { success: true, message: `Cleared ${count} seed records.` };
}
