// src/app/actions/admin-provisioning.ts
"use server";

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Ensure Admin SDK is initialized
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "mindkindler-84fcf" 
    });
}

const db = admin.firestore();
const auth = admin.auth();

const REGION_MAPPING: Record<string, string> = {
    'uk': 'mindkindler-uk',
    'us': 'mindkindler-us',
    'eu': 'mindkindler-eu'
};

export async function provisionIndependentEppAction(formData: any) {
    console.log(`[Admin Action] Provisioning EPP: ${formData.email}`);
    
    try {
        const { email, password, firstName, lastName, region } = formData;
        const shardId = REGION_MAPPING[region];
        if (!shardId) throw new Error(`Invalid region: ${region}`);
        
        // Connect to Regional DB
        const regionalDb = getFirestore(admin.app(), shardId);

        // 1. Create/Get Auth User
        let uid;
        try {
            const userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            console.log(`- User exists: ${uid}`);
        } catch (e) {
            const userRecord = await auth.createUser({
                email,
                password,
                displayName: `${firstName} ${lastName}`,
                emailVerified: true
            });
            uid = userRecord.uid;
            console.log(`- Created new user: ${uid}`);
        }

        const tenantId = `practice_${uid}`;

        // 2. Global Routing (Master Switch)
        await db.collection('user_routing').doc(uid).set({
            uid,
            email,
            region,
            shardId,
            role: 'EducationalPsychologist',
            tenantId,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // 3. Regional Profile (Fixed Structure)
        await regionalDb.collection('users').doc(uid).set({
            uid,
            firstName,
            lastName,
            email,
            role: 'EducationalPsychologist',
            tenantId,
            region,
            createdAt: new Date().toISOString(),
            status: 'active',
            // Nested verification object to match usePermissions hook
            verification: {
                status: 'verified',
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'system_provisioning'
            }
        }, { merge: true });

        // 4. Create Tenant
        await regionalDb.collection('tenants').doc(tenantId).set({
            id: tenantId,
            name: `${lastName} Psychology Practice`,
            type: 'independent_practice',
            region,
            ownerId: uid,
            adminEmail: email,
            plan: 'pro',
            createdAt: new Date().toISOString(),
            settings: { allowMarketplace: true, allowAi: true }
        });

        // 5. Set Claims
        await auth.setCustomUserClaims(uid, {
            role: 'EducationalPsychologist',
            tenantId,
            region
        });

        return { success: true, uid, tenantId };

    } catch (error: any) {
        console.error("Provisioning Failed:", error);
        return { success: false, error: error.message };
    }
}
