import { CallableRequest } from "firebase-functions/v2/https";
import { FirestoreEvent, Change, DocumentSnapshot } from "firebase-functions/v2/firestore";
import { ScheduledEvent } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

// Ensure initializeApp is called if not already. 
// Note: It's better to rely on index.ts init in single file deploys, but for modular files 
// that import admin directly, a safety check is good or pass db instance.
// However, since Cloud Functions load the main entry point, admin.initializeApp in index.ts SHOULD work.
// The error suggests scheduler.ts is evaluated before index.ts or in isolation.
// We will lazy-load the db instance.

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const findAvailabilityHandler = async (request: CallableRequest<any>) => {
    // Logic to merge calendars
    return { slots: [] }; 
};

export const onAppointmentChangeHandler = async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    // Handling v2 format
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    const before = event.data?.before?.exists ? event.data.before.data() : null;

    if (!after) {
        console.log("Appointment cancelled");
        return;
    }

    if (!before) {
        console.log("New Appointment", after);
        return;
    }

    if (after.startTime !== before.startTime) {
        console.log("Rescheduled");
    }
};

export const sendDailyRemindersHandler = async (event: ScheduledEvent) => {
    const db = getDb();
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const snapshot = await db.collection("appointments")
        .where("startTime", ">=", now.toISOString())
        .where("startTime", "<=", next24.toISOString())
        .get();

    snapshot.forEach(doc => {
        const appt = doc.data();
        console.log(`Sending reminder for ${appt.title}`);
    });
};
