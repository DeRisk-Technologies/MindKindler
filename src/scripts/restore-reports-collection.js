const admin = require('firebase-admin');

// --- Configuration ---
if (admin.apps.length === 0) {
    admin.initializeApp();
}

console.log("🌍 Connecting to Regional Database: mindkindler-uk");
const db = admin.firestore(); // Use default if connecting to emulators, or specific instance if deployed
// Note: For this script, we assume it's running in an environment where it can access the UK shard
// or we explicitly select it if possible. 
// However, the error "Missing or insufficient permissions" is usually RULES related or AUTH related in Client SDK.
// But you mentioned the collection was deleted. This script RE-CREATES it.

async function restoreReports() {
    // Target the specific shard
    const targetDb = admin.app().firestore('mindkindler-uk');
    
    console.log("🛠️ Restoring 'reports' collection structure...");

    // Create a dummy report to initialize the collection index
    const dummyRef = targetDb.collection('reports').doc('init_placeholder');
    
    await dummyRef.set({
        id: 'init_placeholder',
        title: 'System Initialization Report',
        studentName: 'Test Student',
        status: 'archived',
        tenantId: 'system', // System tenant
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'system_check'
    });

    console.log("✅ Collection 'reports' initialized.");
    
    // Optional: If we had a backup JSON, we would loop through it here.
    // Since we don't, we just ensure the collection exists so queries don't fail 
    // (though queries on empty collections return empty, not error).
}

restoreReports().catch(console.error);
