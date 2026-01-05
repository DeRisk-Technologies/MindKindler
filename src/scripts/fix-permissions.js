const admin = require('firebase-admin');

// Initialize Admin
if (!admin.apps.length) admin.initializeApp();

async function fixPermissions(email, role, tenantId) {
    if (!email || !role) {
        console.error("Usage: node fix-permissions.js EMAIL ROLE TENANT_ID");
        return;
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`Repairing user ${email} (${uid})...`);

        // 1. Sync Firestore
        const db = admin.firestore();
        await db.collection('users').doc(uid).set({
            role: role,
            tenantId: tenantId || 'default-tenant',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Set Custom Claims (THIS IS WHAT FIXES THE PERMISSION ERROR)
        await admin.auth().setCustomUserClaims(uid, { 
            role: role, 
            tenantId: tenantId || 'default-tenant' 
        });
        
        console.log(`SUCCESS: Claims set for user. Role: ${role}, Tenant: ${tenantId || 'default-tenant'}`);
        console.log("CRITICAL: The user MUST LOG OUT and LOG IN AGAIN to activate these changes.");

    } catch (error) {
        console.error("Error:", error);
    }
}

const args = process.argv.slice(2);
fixPermissions(args[0], args[1], args[2]);
