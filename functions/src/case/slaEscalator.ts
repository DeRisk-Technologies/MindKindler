import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const slaEscalator = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Scan all tenants? Or use collectionGroup query if allowed.
    // Query: cases where status != 'resolved' AND slaDueAt < now AND status != 'escalated'
    // Note: status 'escalated' might not be in schema, maybe use tag or priority bump.
    // Let's assume we bump priority to Critical and add tag 'overdue'.

    const query = db.collectionGroup('cases')
        .where('status', 'in', ['triage', 'active', 'waiting'])
        .where('slaDueAt', '<', now);

    const snapshot = await query.get();

    if (snapshot.empty) return null;

    const batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        // Avoid re-escalating
        if (data.tags && data.tags.includes('overdue')) continue;

        // 1. Mark Overdue
        batch.update(doc.ref, {
            priority: 'Critical',
            tags: admin.firestore.FieldValue.arrayUnion('overdue'),
            updatedAt: now
        });

        // 2. Add Timeline Event (Must be subcollection, batch supports it)
        const timelineRef = doc.ref.collection('timeline').doc();
        batch.set(timelineRef, {
            type: 'status_change',
            content: 'SLA Breached. Priority escalated to Critical.',
            actorId: 'system',
            createdAt: now,
            metadata: { reason: 'sla_overdue' }
        });

        // 3. Notify Tenant (Parent doc path tells us tenant)
        // doc.ref.path = tenants/{tid}/cases/{cid}
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
            // In real app, create new batch
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    console.log(`SLA Escalator processed ${snapshot.size} cases.`);
    return null;
});
