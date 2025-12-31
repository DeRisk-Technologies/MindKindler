import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

// Mock Sync Engine
export const syncExternalData = async (request: CallableRequest) => {
    const db = getDb();
    
    // 1. Fetch active integrations
    const integrationsSnap = await db.collection("integrations").where("status", "==", "active").get();
    
    if (integrationsSnap.empty) {
        return { success: false, message: "No active integrations found." };
    }

    let syncedCount = 0;

    // 2. Iterate and "Fetch" Data (Mocking external API call)
    for (const doc of integrationsSnap.docs) {
        const config = doc.data();
        
        // Mock Data: External Grades
        const mockGrades = [
            { studentId: "std_mock_1", subject: "Math", score: 88, source: config.type },
            { studentId: "std_mock_2", subject: "Science", score: 92, source: config.type },
        ];

        // 3. Upsert into 'assessment_results' or 'external_grades'
        const batch = db.batch();
        
        for (const grade of mockGrades) {
            const ref = db.collection("external_academic_records").doc(); // New collection for external data
            batch.set(ref, {
                ...grade,
                syncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            syncedCount++;
        }
        
        await batch.commit();
        
        // Update last sync time
        await doc.ref.update({ lastSync: new Date().toISOString() });
    }

    return { success: true, message: `Synced ${syncedCount} records from ${integrationsSnap.size} providers.` };
};
