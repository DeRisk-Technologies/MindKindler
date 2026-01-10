// functions/src/case/autoCreateFromAlerts.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) admin.initializeApp();

const REGIONAL_DB_MAPPING: Record<string, string> = {
    'uk': 'mindkindler-uk',
    'us': 'mindkindler-us',
    'eu': 'mindkindler-eu',
    'default': '(default)'
};

/**
 * PHASE 28 FIX: Region-Aware Case Logic
 * The trigger must listen to specific databases, not just the default one.
 * Since v2 triggers don't support wildcard databases easily in one function,
 * we assume alerts are written to the default DB routing layer OR we deploy per region.
 * 
 * FOR PILOT: We will listen to the DEFAULT database where global alerts might route,
 * BUT write the resulting Case to the correct REGIONAL shard.
 */
export const onAlertCreated = onDocumentCreated({
    document: "alerts/{alertId}", // Global Alert Stream (Simulated)
    region: "europe-west3"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const alertData = snap.data();
    const { tenantId, region } = alertData; // Alert MUST carry region context

    if (!tenantId || !region) {
        console.warn(`[AutoCreate] Alert ${event.params.alertId} missing tenant/region.`);
        return;
    }

    try {
        // 1. Connect to Regional DB
        const dbId = REGIONAL_DB_MAPPING[region] || REGIONAL_DB_MAPPING['default'];
        const regionalDb = getFirestore(admin.app(), dbId);

        // 2. Fetch Tenant Rules (from Shard or Global? Ideally Global for Config)
        // We'll check Global for config, Write to Shard for Data
        const globalDb = admin.firestore();
        const rulesSnap = await globalDb.doc(`tenants/${tenantId}/settings/caseSlaRules`).get();
        const rules = rulesSnap.exists ? rulesSnap.data() : { autoCreateEnabled: true, autoCreateCritical: true }; // Default for Pilot

        if (!rules?.autoCreateEnabled) return;

        // 3. Evaluate Logic
        if (alertData.severity === 'critical' && rules.autoCreateCritical) {
            await createSystemCase(regionalDb, tenantId, alertData, 'Critical Risk Detected');
        }

    } catch (e) {
        console.error(`[AutoCreate] Failed for alert ${event.params.alertId}`, e);
    }
});

async function createSystemCase(db: any, tenantId: string, alert: any, reason: string) {
    // Write directly to the Regional "cases" collection
    // Note: We write to 'cases' root in Shard, not nested under tenant
    await db.collection('cases').add({
        tenantId: tenantId, // Link to tenant
        type: 'student',
        subjectId: alert.studentId || 'unknown',
        title: `[Auto] ${alert.title}`,
        description: `${reason}. Automatically created from Alert.`,
        priority: 'Critical',
        status: 'triage',
        createdBy: 'system',
        sourceAlertId: alert.id,
        createdAt: new Date().toISOString(), // Use ISO string for cross-db safety
        updatedAt: new Date().toISOString(),
        slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    console.log(`[AutoCreate] Created Case in Shard for ${alert.studentId}`);
}
