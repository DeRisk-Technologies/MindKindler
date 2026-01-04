// functions/src/integrations/syncEngine.ts

import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { OneRosterConnector } from "./connectors/oneroster";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const syncExternalData = async (request: CallableRequest) => {
    const db = getDb();
    
    // 1. Fetch active integrations
    const integrationsSnap = await db.collection("integrations").where("status", "==", "active").get();
    
    if (integrationsSnap.empty) {
        return { success: false, message: "No active integrations found." };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    // 2. Iterate and Fetch Data
    for (const doc of integrationsSnap.docs) {
        const config = doc.data();
        let records = [];

        try {
            if (config.type === 'oneroster') {
                // Decrypt secrets here in prod (e.g. Secret Manager)
                // For now reading from doc or env
                const rosterConfig = {
                    clientId: config.clientId || process.env.ONEROSTER_CLIENT_ID || '',
                    clientSecret: config.clientSecret || process.env.ONEROSTER_CLIENT_SECRET || '',
                    baseUrl: config.baseUrl
                };
                
                if (!rosterConfig.clientId) {
                    throw new Error(`Missing credentials for ${doc.id}`);
                }

                records = await OneRosterConnector.fetchGrades(rosterConfig);
            } else {
                console.log(`Skipping unknown integration type: ${config.type}`);
                continue;
            }

            // 3. Upsert into 'external_academic_records'
            if (records.length > 0) {
                const batch = db.batch();
                let batchCount = 0;

                for (const rec of records) {
                    // Create a deterministic ID to avoid dupes
                    const id = `${config.type}_${rec.studentId}_${rec.subject}_${rec.date}`;
                    const ref = db.collection("external_academic_records").doc(id);
                    
                    batch.set(ref, {
                        ...rec,
                        integrationId: doc.id,
                        syncedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    
                    batchCount++;
                    syncedCount++;
                }
                
                await batch.commit();
                
                // Update last sync time
                await doc.ref.update({ 
                    lastSync: new Date().toISOString(),
                    syncStatus: 'success',
                    recordsSynced: batchCount
                });
            }
        } catch (e: any) {
            console.error(`Sync error for ${doc.id}`, e);
            errors.push(`${doc.id}: ${e.message}`);
            await doc.ref.update({ syncStatus: 'error', lastError: e.message });
        }
    }

    return { 
        success: errors.length === 0, 
        syncedCount, 
        message: errors.length > 0 ? `Synced with errors: ${errors.join('; ')}` : "Sync complete."
    };
};
