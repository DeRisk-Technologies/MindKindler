const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Admin with Service Account (Required for multi-db access in scripts)
// Note: Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your env, or use default credentials
if (!admin.apps.length) admin.initializeApp();

async function fixPermissions(email, role, region = 'uk') {
    if (!email || !role) {
        console.error("Usage: node src/scripts/fix-permissions.js EMAIL ROLE [REGION]");
        return;
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`🚀 Repairing user ${email} (${uid}) for region ${region}...`);

        // 1. Fix Global Routing (Default DB)
        const globalDb = admin.firestore();
        await globalDb.collection('user_routing').doc(uid).set({
            uid: uid,
            email: email,
            role: role,
            region: region,
            shardId: `mindkindler-${region}`,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("✅ Global Routing Updated");

        // 2. Fix Regional Profile (Shard)
        const shardId = `mindkindler-${region}`;
        const regionalDb = getFirestore(admin.app(), shardId);
        
        await regionalDb.collection('users').doc(uid).set({
            uid: uid,
            email: email,
            role: role,
            firstName: "Fixed",
            lastName: "Admin",
            displayName: `Fixed Admin (${region})`,
            tenantId: "default",
            verification: { status: "verified", verifiedAt: new Date().toISOString() },
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`✅ Regional Profile (${shardId}) Updated`);

        // 3. Set Custom Claims (Fast Path)
        await admin.auth().setCustomUserClaims(uid, { 
            role: role, 
            region: region, 
            tenantId: 'default' 
        });
        console.log("✅ Custom Claims Set");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// CLI Argument Parsing
const args = process.argv.slice(2);
if (args.length >= 2) {
    fixPermissions(args[0], args[1], args[2]);
} else {
    console.log("Interactive Mode: Please provide args.");
    console.log("Example: node src/scripts/fix-permissions.js admin_uk@mindkindler.com SuperAdmin uk");
}
