import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { faker } from '@faker-js/faker';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Super Seed Script for Pilot (Region Aware)
 * 
 * Modes:
 * 1. Default: Seeds students into a region.
 * 2. action='create_regional_admins': Creates SuperAdmin accounts for all regions.
 */
export const seedDemoDataHandler = async (request: CallableRequest) => {
    
    // --- MODE: Create Regional Admins ---
    if (request.data.action === 'create_regional_admins') {
        const regions = ['uk', 'us', 'eu', 'asia', 'sa', 'me'];
        const results = [];
        const globalDb = admin.firestore();

        for (const region of regions) {
            const email = `admin_${region}@mindkindler.com`;
            const password = `Pilot${region.toUpperCase()}2026!`; // Strong default
            const displayName = `Regional Admin (${region.toUpperCase()})`;
            
            try {
                // 1. Create Auth User
                let userRecord;
                try {
                    userRecord = await admin.auth().getUserByEmail(email);
                    console.log(`User ${email} exists, updating...`);
                } catch (e) {
                    userRecord = await admin.auth().createUser({
                        email,
                        password,
                        displayName,
                        emailVerified: true
                    });
                    console.log(`Created Auth User: ${email}`);
                }

                // Set Custom Claims (Fast Path)
                await admin.auth().setCustomUserClaims(userRecord.uid, { 
                    role: 'SuperAdmin', 
                    region,
                    tenantId: 'default' 
                });

                // 2. Global Routing (Default DB)
                await globalDb.doc(`user_routing/${userRecord.uid}`).set({
                    uid: userRecord.uid,
                    region,
                    shardId: `mindkindler-${region}`,
                    email,
                    role: 'SuperAdmin',
                    createdAt: new Date().toISOString()
                }, { merge: true });

                // 3. Regional Profile (Shard)
                const shardId = `mindkindler-${region}`;
                const regionalDb = getFirestore(admin.app(), shardId);
                
                await regionalDb.doc(`users/${userRecord.uid}`).set({
                    uid: userRecord.uid,
                    firstName: "Regional",
                    lastName: `Admin ${region.toUpperCase()}`,
                    displayName,
                    email,
                    role: "SuperAdmin", // Regional SuperAdmin
                    region,
                    tenantId: "default",
                    verification: { status: "verified", verifiedAt: new Date().toISOString() },
                    createdAt: new Date().toISOString(),
                    isSeed: true
                }, { merge: true });

                results.push({ region, email, password });

            } catch (err: any) {
                console.error(`Failed to seed ${region}`, err);
                results.push({ region, error: err.message });
            }
        }

        return { 
            success: true, 
            message: "Regional Admins Created", 
            credentials: results 
        };
    }

    // --- MODE: Seed Students (Existing Logic) ---
    
    // 1. Parse Request
    const region = request.data.region || 'uk'; 
    const tenantId = request.data.tenantId || 'default';
    
    console.log(`[Seed] Starting for Tenant: ${tenantId}, Region: ${region}`);

    // 2. Connect to Shard
    const shardId = `mindkindler-${region}`;
    const targetDb = region === 'default' ? admin.firestore() : getFirestore(admin.app(), shardId);
    const globalDb = admin.firestore();

    const batch = targetDb.batch();
    
    // 3. Seed Configuration (Global Router)
    if (request.data.seedConfig) {
        const configRef = globalDb.doc(`tenants/${tenantId}/settings/schema_config`);
        
        let schemaPayload = {};
        if (region === 'uk') {
             schemaPayload = {
                studentFields: [
                    { fieldName: "uk_upn", label: "Unique Pupil Number (UPN)", type: "string", required: true },
                    { fieldName: "uk_pupil_premium", label: "Pupil Premium", type: "boolean" }
                ],
                staffFields: [
                    { fieldName: "scr_dbs_number", label: "DBS Number", type: "string", encrypt: true, required: true }
                ]
             };
        } else if (region === 'us') {
             schemaPayload = {
                studentFields: [
                    { fieldName: "us_state_id", label: "State Student ID", type: "string", required: true },
                    { fieldName: "us_iep_status", label: "IEP Status", type: "enum", options: ["Active", "Pending", "Exited"] }
                ],
                staffFields: []
             };
        }

        await configRef.set({
            updatedAt: new Date().toISOString(),
            installedPackId: `${region}_pack`,
            isSeed: true,
            ...schemaPayload
        }, { merge: true });
    }

    // 4. Seed Students (Regional Shard)
    const count = request.data.count || 5;
    
    for (let i = 0; i < count; i++) {
        const studentRef = targetDb.collection("students").doc();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const extensionData = region === 'uk' ? {
             uk_upn: `A${faker.number.int({ min: 100000000000, max: 999999999999 })}`,
             uk_sen_status: faker.helpers.arrayElement(['K', 'E', 'N'])
        } : {
             us_state_id: `US-${faker.number.int({ min: 100000, max: 999999 })}`,
             us_iep_status: faker.helpers.arrayElement(['Active', 'None'])
        };

        batch.set(studentRef, {
            id: studentRef.id,
            tenantId,
            isSeed: true, 
            identity: {
                firstName: { value: firstName, metadata: { verified: true } },
                lastName: { value: lastName, metadata: { verified: true } },
                dateOfBirth: { value: faker.date.birthdate({ min: 5, max: 11, mode: 'age' }).toISOString().split('T')[0], metadata: { verified: true } },
                gender: { value: faker.person.sexType(), metadata: {} },
            },
            education: {
                currentSchoolId: { value: "demo_school", metadata: {} },
                yearGroup: { value: region === 'uk' ? `Year ${faker.number.int({ min: 1, max: 6 })}` : `Grade ${faker.number.int({ min: 1, max: 5 })}`, metadata: {} },
            },
            extensions: extensionData,
            family: { parents: [] },
            health: { allergies: { value: [], metadata: {} }, conditions: { value: [], metadata: {} }, medications: { value: [], metadata: {} } },
            meta: {
                trustScore: 100,
                createdAt: new Date().toISOString()
            }
        });
    }

    await batch.commit();

    return { success: true, message: `Seeded ${count} ${region.toUpperCase()} students to ${shardId}.` };
};
