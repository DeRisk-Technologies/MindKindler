import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const slaEscalator = functions.region('europe-west3').pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    const query = db.collectionGroup('cases')
        .where('status', 'in', ['triage', 'active', 'waiting'])
        .where('slaDueAt', '<', now);

    const snapshot = await query.get();

    if (snapshot.empty) return null;

    const batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.tags && data.tags.includes('overdue')) continue;

        batch.update(doc.ref, {
            priority: 'Critical',
            tags: admin.firestore.FieldValue.arrayUnion('overdue'),
            updatedAt: now
        });

        const timelineRef = doc.ref.collection('timeline').doc();
        batch.set(timelineRef, {
            type: 'status_change',
            content: 'SLA Breached. Priority escalated to Critical.',
            actorId: 'system',
            createdAt: now,
            metadata: { reason: 'sla_overdue' }
        });

        const pathSegments = doc.ref.path.split('/');
        const tenantId = pathSegments[1];
        
        const notifRef = db.collection(`tenants/${tenantId}/notifications`).doc();
        batch.set(notifRef, {
            type: 'sla_breach',
            caseId: doc.id,
            title: `Case ${data.title} is Overdue`,
            createdAt: now,
            read: false
        });

        count++;
        if (count >= 400) {
            await batch.commit();
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    console.log(`SLA Escalator processed ${snapshot.size} cases.`);
    return null;
});
