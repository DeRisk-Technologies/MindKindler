const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// --- Configuration ---
// Check if app is already initialized
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'mindkindler-84fcf'
    });
}

async function restoreReports() {
    console.log("🌍 Connecting to Regional Database: mindkindler-uk...");
    
    // Correct way to access a named database in Admin SDK
    const targetDb = getFirestore(admin.app(), 'mindkindler-uk');
    
    console.log("🛠️ Restoring 'reports' collection structure...");

    try {
        // Create a dummy report to initialize the collection
        const dummyRef = targetDb.collection('reports').doc('init_placeholder');
        
        await dummyRef.set({
            id: 'init_placeholder',
            title: 'System Initialization Report',
            studentName: 'Test Student',
            status: 'archived',
            tenantId: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: 'system_check',
            // Add other mandatory fields from schema to prevent client-side crashes
            caseId: 'system-case',
            generatedBy: 'system-restore-script'
        });

        console.log("✅ Collection 'reports' successfully initialized in 'mindkindler-uk'.");
        console.log("ℹ️  You can verify this in the Firebase Console > Firestore > mindkindler-uk");

    } catch (error) {
        console.error("❌ Failed to restore reports collection:", error);
        
        if (error.code === 5) { // NOT_FOUND
            console.error("   Hint: Does the database 'mindkindler-uk' exist? You may need to create it in the Firebase Console first.");
        }
    }
}

restoreReports().catch(console.error);
