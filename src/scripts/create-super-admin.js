const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// Requires GOOGLE_APPLICATION_CREDENTIALS environment variable to be set
// or run locally with `firebase emulators:start` or `firebase use` context if using SDK
admin.initializeApp();

async function makeSuperAdmin(email) {
    if (!email) {
        console.error("Please provide an email address.");
        process.exit(1);
    }

    try {
        // 1. Find user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`Found user ${email} with UID: ${uid}`);

        // 2. Update Firestore Role
        const db = admin.firestore();
        await db.collection('users').doc(uid).set({
            role: 'SuperAdmin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Updated Firestore document for ${uid} to role: SuperAdmin`);

        // 3. Set Custom Claims (Critical for Security Rules)
        await admin.auth().setCustomUserClaims(uid, { role: 'SuperAdmin' });
        
        console.log(`Set Custom Claims for ${uid}. Role: SuperAdmin`);
        console.log("SUCCESS: User must re-login to see changes.");

    } catch (error) {
        console.error("Error upgrading user:", error);
    }
}

// Get email from command line arg
const targetEmail = process.argv[2];
makeSuperAdmin(targetEmail);
