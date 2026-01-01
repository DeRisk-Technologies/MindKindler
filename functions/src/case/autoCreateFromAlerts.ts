import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

// Ensure admin initialized
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Trigger: When an Alert is created
export const onAlertCreated = functions.firestore
    .document('tenants/{tenantId}/alerts/{alertId}')
    .onCreate(async (snap, context) => {
        const { tenantId, alertId } = context.params;
        const alertData = snap.data();

        if (!alertData) return;

        try {
            // 1. Fetch Tenant Rules
            // Optimized: Could cache rules in global var for warm instances
            const rulesSnap = await db.doc(`tenants/${tenantId}/settings/caseSlaRules`).get();
            const rules = rulesSnap.exists ? rulesSnap.data() : null;

            if (!rules || !rules.autoCreateEnabled) return;

            // 2. Evaluate Auto-Create Logic
            // Logic A: Critical Severity -> Auto Case
            if (alertData.severity === 'critical' && rules.autoCreateCritical) {
                await createSystemCase(tenantId, alertData, 'Critical Risk Detected');
                return;
            }

            // Logic B: Pattern Detection (School Level)
            // e.g. If > 3 alerts of type 'attendance' in same school in 24h
            // Simplified check: Just query count.
            if (alertData.schoolId) {
                const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
                const q = db.collection(`tenants/${tenantId}/alerts`)
                    .where('schoolId', '==', alertData.schoolId)
                    .where('type', '==', alertData.type)
                    .where('createdAt', '>', cutoff);
                
                const recentAlerts = await q.count().get();
                const threshold = rules.schoolThreshold || 5;

                if (recentAlerts.data().count >= threshold) {
                    await createSchoolCase(tenantId, alertData.schoolId, alertData.type, threshold);
                }
            }

        } catch (e) {
            console.error(`Auto-create failed for alert ${alertId}`, e);
        }
    });

async function createSystemCase(tenantId: string, alert: any, reason: string) {
    // Dedup check: Check if open case exists for this alert?
    // Assume alert links to case later, or we check if alert.caseId is set (but trigger is onCreate)
    
    await db.collection(`tenants/${tenantId}/cases`).add({
        type: 'student',
        subjectId: alert.studentId || 'unknown',
        title: `[Auto] ${alert.title}`,
        description: `${reason}. Automatically created from Alert.`,
        priority: 'Critical',
        status: 'triage',
        createdBy: 'system',
        sourceAlertId: alert.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        slaDueAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000) // 24h default
    });
}

async function createSchoolCase(tenantId: string, schoolId: string, type: string, count: number) {
    // Check if active school case exists for this type
    const q = db.collection(`tenants/${tenantId}/cases`)
        .where('type', '==', 'school')
        .where('subjectId', '==', schoolId)
        .where('status', 'in', ['triage', 'active'])
        .limit(1);
    
    const existing = await q.get();
    if (!existing.empty) return; // Already tracking

    await db.collection(`tenants/${tenantId}/cases`).add({
        type: 'school',
        subjectId: schoolId,
        title: `[Auto] High Volume of ${type} alerts`,
        description: `Detected ${count} alerts of type ${type} in the last 24 hours.`,
        priority: 'High',
        status: 'triage',
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        slaDueAt: admin.firestore.Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000)
    });
}
