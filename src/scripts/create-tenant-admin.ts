// src/scripts/create-tenant-admin.ts
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "mindkindler-84fcf"
    });
}

const db = admin.firestore(); // Default Global DB
const auth = admin.auth();

const REGION_MAPPING: Record<string, string> = {
    'uk': 'mindkindler-uk',
    'us': 'mindkindler-us',
    'eu': 'mindkindler-eu'
};

interface EppInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    region: string;
}

async function provisionIndependentEpp(input: EppInput) {
    console.log(`\n🚀 Starting Provisioning for Independent EPP: ${input.email}`);
    
    try {
        // 1. Resolve Region DB
        const shardId = REGION_MAPPING[input.region];
        if (!shardId) throw new Error(`Invalid region: ${input.region}`);
        const regionalDb = getFirestore(admin.app(), shardId);

        // 2. Create/Get Auth User
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(input.email);
            console.log(`- User exists in Auth: ${userRecord.uid}`);
        } catch (e) {
            userRecord = await auth.createUser({
                email: input.email,
                password: input.password,
                displayName: `${input.firstName} ${input.lastName}`,
                emailVerified: true
            });
            console.log(`- Created new Auth User: ${userRecord.uid}`);
        }

        const uid = userRecord.uid;
        // Generate Practice Tenant ID
        const tenantId = `practice_${uid}`; 

        // 3. GLOBAL ROUTING (The "Master Switch")
        // This is what the client/middleware reads to know where to go.
        console.log(`- Updating Global Routing (user_routing)...`);
        await db.collection('user_routing').doc(uid).set({
            uid,
            email: input.email,
            region: input.region,
            shardId: shardId,
            role: 'EducationalPsychologist', // Maps to EPP permissions
            tenantId: tenantId, // <--- CRITICAL: Links user to their practice
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // 4. REGIONAL PROFILE
        // This is the profile data displayed in the dashboard.
        console.log(`- Creating Profile in ${shardId}...`);
        await regionalDb.collection('users').doc(uid).set({
            uid,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            role: 'EducationalPsychologist',
            tenantId: tenantId,
            region: input.region,
            createdAt: new Date().toISOString(),
            status: 'active',
            verificationStatus: 'verified' // Auto-verify for manual creation
        }, { merge: true });

        // 5. CREATE TENANT
        // The actual "Organization" record for their practice.
        console.log(`- Creating Tenant Record: ${tenantId}...`);
        await regionalDb.collection('tenants').doc(tenantId).set({
            id: tenantId,
            name: `${input.lastName} Psychology Practice`,
            type: 'independent_practice',
            region: input.region,
            ownerId: uid,
            adminEmail: input.email,
            plan: 'pro',
            createdAt: new Date().toISOString(),
            settings: {
                allowMarketplace: true,
                allowAi: true
            }
        });

        // 6. FORCE CLAIMS REFRESH
        // Immediate access without waiting for triggers.
        console.log(`- Setting Auth Claims...`);
        await auth.setCustomUserClaims(uid, {
            role: 'EducationalPsychologist',
            tenantId: tenantId,
            region: input.region
        });

        console.log(`\n✅ SUCCESS!`);
        console.log(`   User: ${input.email}`);
        console.log(`   Tenant: ${tenantId}`);
        console.log(`   Region: ${input.region} (${shardId})`);
        console.log(`   \n👉 You can now login. The dashboard will load the correct data.`);

    } catch (error) {
        console.error("❌ Provisioning Failed:", error);
    }
}

// --- CONFIGURATION ---
// Change these values to create your specific user
const NEW_USER = {
    email: "testuser17@example.com", // Change this
    password: "Password123!",
    firstName: "Helena",
    lastName: "Independent",
    region: "uk"
};

provisionIndependentEpp(NEW_USER);
