import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { emailService } from '../services/email';

const db = admin.firestore();

// --- Configuration ---
// In prod, use: const SENDGRID_KEY = process.env.SENDGRID_KEY;

interface ProvisionData {
    name: string;
    type: string;
    region: string;
    contactName: string;
    contactEmail: string;
    planTier: string;
}

/**
 * provisionTenant (Cloud Function)
 * 
 * Orchestrates the creation of a new Enterprise Tenant.
 * 1. Creates Organization record.
 * 2. Creates Admin User for the Tenant.
 * 3. Sends Welcome Email with Login Instructions.
 */
export const provisionTenant = functions.https.onCall(async (data: ProvisionData, context) => {
    // 1. Security Check: Only SuperAdmin can call this
    if (!context.auth?.token?.role || context.auth.token.role !== 'SuperAdmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only SuperAdmins can provision tenants.');
    }

    const { name, type, region, contactName, contactEmail, planTier } = data;

    try {
        console.log(`[Provisioning] Starting for: ${name} (${type}) in ${region}`);

        // 2. Create Organization Document
        const orgRef = db.collection('organizations').doc();
        const orgId = orgRef.id;

        const orgData = {
            id: orgId,
            name,
            type,
            region,
            planTier,
            status: 'provisioning', // Initial status
            primaryContact: { name: contactName, email: contactEmail, roleTitle: 'Admin' },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            provisionedBy: context.auth.uid
        };

        await orgRef.set(orgData);

        // 3. Create Tenant Admin User (in Auth and Firestore)
        let adminUid;
        try {
            // Check if user exists
            const userRecord = await admin.auth().getUserByEmail(contactEmail);
            adminUid = userRecord.uid;
            console.log(`[Provisioning] User ${contactEmail} exists. Linking to new tenant.`);
        } catch (e) {
            // Create new user
            const newUser = await admin.auth().createUser({
                email: contactEmail,
                emailVerified: true, // Auto-verify for enterprise invites
                displayName: contactName,
                // password: 'tempPassword123!' // In prod, trigger password reset email instead
            });
            adminUid = newUser.uid;
            console.log(`[Provisioning] Created new Admin User: ${adminUid}`);
        }

        // Set Claims & Profile
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

        // 4. Send Welcome Email
        const loginUrl = `https://mindkindler.com/login?tenant=${orgId}`;
        const emailBody = `
            Dear ${contactName},
            
            The MindKindler environment for "${name}" has been successfully provisioned.
            
            You have been assigned as the Organization Administrator.
            
            Please log in to set up your profile and invite your team:
            ${loginUrl}
            
            Your Tenant ID is: ${orgId}
            
            Regards,
            The MindKindler Team
        `;

        await emailService.send({
            to: contactEmail,
            subject: "Welcome to MindKindler - Your Workspace is Ready",
            text: emailBody
        });

        // 5. Finalize
        await orgRef.update({ status: 'active', provisionedAt: admin.firestore.FieldValue.serverTimestamp() });

        return { 
            success: true, 
            orgId: orgId, 
            message: `Tenant ${name} provisioned. Welcome email sent to ${contactEmail}.` 
        };

    } catch (error: any) {
        console.error("[Provisioning] Failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
