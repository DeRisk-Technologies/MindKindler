import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Smart Cleanup Script
 * Only removes records tagged with 'isSeed: true'
 */
export const clearDemoDataHandler = async (request: CallableRequest) => {
    const region = request.data.region || 'uk';
    const tenantId = request.data.tenantId || 'default';
    
    // Connect to correct shard
    const shardId = `mindkindler-${region}`;
    const targetDb = region === 'default' ? admin.firestore() : getFirestore(admin.app(), shardId);

    const batch = targetDb.batch();
    let deleteCount = 0;

    // 1. Find Seed Students
    const studentsQuery = await targetDb.collection("students")
        .where("tenantId", "==", tenantId)
        .where("isSeed", "==", true)
        .limit(500) // Safety limit
        .get();

    studentsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
    });

    // 2. Find Seed Staff (if any)
    const staffQuery = await targetDb.collection(`tenants/${tenantId}/staff`)
        .where("isSeed", "==", true)
        .get();

    staffQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
    });

    // 3. Find Seed Cases
    const casesQuery = await targetDb.collection("cases")
        .where("tenantId", "==", tenantId)
        .where("isSeed", "==", true)
        .get();
    
    casesQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
    });

    if (deleteCount > 0) {
        await batch.commit();
    }

    return { success: true, message: `Cleaned ${deleteCount} seed records from ${shardId}. Real data preserved.` };
};
