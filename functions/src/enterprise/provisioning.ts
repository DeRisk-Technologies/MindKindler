import { onCall, HttpsOptions, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { emailService } from '../services/email';

const db = admin.firestore();
const region = "europe-west3";
const callOptions: HttpsOptions = { region, cors: true };

interface ProvisionData {
    name: string;
    type: string;
    region: string;
    contactName: string;
    contactEmail: string;
    planTier: string;
    parentId?: string;
    metadata?: {
        registryId?: string; // The ID of the OrgUnit in the hierarchy tree
    };
}

export const provisionTenant = onCall(callOptions, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Login required.');

    const userSnap = await db.collection('users').doc(uid).get();
    const userRole = userSnap.data()?.role;
    const tokenRole = request.auth?.token?.role;

    const isAuthorized = ['SuperAdmin', 'Admin', 'admin'].includes(tokenRole) || 
                         ['SuperAdmin', 'Admin', 'admin'].includes(userRole);

    if (!isAuthorized) {
        throw new HttpsError('permission-denied', 'Only SuperAdmins can provision tenants.');
    }

    const { name, type, region, contactName, contactEmail, planTier, parentId, metadata } = request.data as ProvisionData;

    try {
        const orgRef = db.collection('organizations').doc();
        const orgId = orgRef.id;

        const orgData = {
            id: orgId,
            name,
            type,
            region,
            planTier,
            status: 'active',
            primaryContact: { name: contactName, email: contactEmail, roleTitle: 'Admin' },
            parentId: parentId && parentId !== 'none' ? parentId : null, 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: uid,
            linkedRegistryId: metadata?.registryId || null // Link to the hierarchy node
        };

        await orgRef.set(orgData);

        // --- NEW: Bridge Registry to Tenant ---
        // If this provision came from the Wizard (has registryId), mark that node as a Tenant Root
        if (metadata?.registryId) {
            const registryRef = db.collection('org_units').doc(metadata.registryId);
            await registryRef.set({
                isTenantRoot: true,
                tenantId: orgId, // This allows the LEA Admin to "own" this branch
                subscriptionTier: 'STANDARD' // Default
            }, { merge: true });
            
            console.log(`[Provisioning] Upgraded OrgUnit ${metadata.registryId} to Tenant Root linked to ${orgId}`);
        }

        // Create Admin User
        let adminUid;
        try {
            const userRecord = await admin.auth().getUserByEmail(contactEmail);
            adminUid = userRecord.uid;
        } catch (e) {
            const newUser = await admin.auth().createUser({
                email: contactEmail,
                emailVerified: true,
                displayName: contactName,
            });
            adminUid = newUser.uid;
        }

        await admin.auth().setCustomUserClaims(adminUid, { 
            role: 'TenantAdmin', 
            tenantId: orgId 
        });

        await db.collection('users').doc(adminUid).set({
            displayName: contactName,
            email: contactEmail,
            role: 'TenantAdmin',
            tenantId: orgId,
            orgMemberships: [{ orgId, role: 'TenantAdmin', status: 'active', joinedAt: new Date().toISOString() }]
        }, { merge: true });

        await emailService.send({
            to: contactEmail,
            subject: "Welcome to MindKindler",
            text: `MindKindler Environment ready for ${name}.`
        });

        return { success: true, orgId: orgId, message: `Tenant ${name} provisioned and linked to Global Registry.` };

    } catch (error: any) {
        console.error("[Provisioning] Failed:", error);
        throw new HttpsError('internal', error.message);
    }
});
