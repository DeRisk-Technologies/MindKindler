import { FirestoreEvent, Change, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const gradeSubmissionHandler = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const db = getDb();
    const snapshot = event.data;
    if (!snapshot) return;

    const result = snapshot.data();
    if (!result) return;

    const templateId = result.templateId;
    
    // Fetch template to get correct answers
    const tmplSnap = await db.collection("assessment_templates").doc(templateId).get();
    if (!tmplSnap.exists) return;
    
    let score = 0;
    
    await snapshot.ref.update({
        finalScore: score,
        status: 'graded'
    });
};

export const detectAnomaliesHandler = async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    // Logic for trend detection
    console.log("Analyzing anomalies...");
};
