// functions/src/govintel/aggregation.ts

import { onCall, CallableRequest, HttpsError, HttpsOptions } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

interface AggregationRequest {
    nodeId: string;
    level: 'lea' | 'region' | 'national';
}

const region = "europe-west3";
const callOptions: HttpsOptions = { region, cors: true };

/**
 * Aggregates statistics from child tenants up to a GovIntel node.
 * Uses recursive aggregation or direct queries based on depth.
 */
export const aggregateGovStats = onCall(callOptions, async (request: CallableRequest<AggregationRequest>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');

    const { nodeId } = request.data;
    const db = admin.firestore();

    // 1. Identify Child Tenants
    // In a real implementation, this would query a 'hierarchy' collection.
    // Assuming 'nodeId' is a key in `organizations` that holds child references.
    
    // For MVP/Demo, let's assume we query all tenants belonging to this LEA
    const tenantsQuery = db.collection('organizations').where('leaId', '==', nodeId);
    const tenantsSnap = await tenantsQuery.get();
    
    if (tenantsSnap.empty) {
        return { message: "No child tenants found." };
    }

    let totalStudents = 0;
    let atRiskStudents = 0;
    let openCases = 0;
    
    // 2. Aggregate Data (Parallelized)
    // NOTE: This is expensive if done naively. Production should use Distributed Counters or Scheduled Functions.
    const promises = tenantsSnap.docs.map(async (tenantDoc) => {
        const tenantId = tenantDoc.id;
        
        // Fetch Tenant Summary (maintained by other triggers ideally)
        const summaryDoc = await db.doc(`tenants/${tenantId}/metrics/summary`).get();
        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            totalStudents += (data?.studentCount || 0);
            atRiskStudents += (data?.atRiskCount || 0);
            openCases += (data?.openCaseCount || 0);
        }
    });

    await Promise.all(promises);

    // 3. Write Result
    const stats = {
        totalStudents,
        atRiskStudents,
        avgAttendance: 0, // Placeholder
        casesOpen: openCases,
        casesResolvedLast30Days: 0, // Placeholder
        lastUpdated: new Date().toISOString()
    };

    await db.doc(`gov_stats/${nodeId}`).set(stats, { merge: true });

    return { success: true, stats };
});
