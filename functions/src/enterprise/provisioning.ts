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
}

export const provisionTenant = onCall(callOptions, async (request) => {
    // 1. IMPROVED SECURITY CHECK
    // Allow if role is in token OR if SuperAdmin in Firestore
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

    const { name, type, region, contactName, contactEmail, planTier } = request.data as ProvisionData;

    try {
        console.log(`[Provisioning] Starting for: ${name} (${type}) in ${region}`);

        // 2. Create Organization Document (In Default DB)
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: uid
        };

        await orgRef.set(orgData);

        // 3. Create Tenant Admin User
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

        // Set Claims
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

        // 4. Send Welcome Email (Simulated)
        const loginUrl = `https://mindkindler-84fcf.web.app/login?tenant=${orgId}`;
        const emailBody = `
            Dear ${contactName},
            The MindKindler environment for "${name}" is ready.
            Role: Organization Administrator
            Login: ${loginUrl}
            Tenant ID: ${orgId}
            Region: ${region}
        `;

        await emailService.send({
            to: contactEmail,
            subject: "Welcome to MindKindler",
            text: emailBody
        });

        return { 
            success: true, 
            orgId: orgId, 
            message: `Tenant ${name} provisioned successfully in ${region}.` 
        };

    } catch (error: any) {
        console.error("[Provisioning] Failed:", error);
        throw new HttpsError('internal', error.message);
    }
});
