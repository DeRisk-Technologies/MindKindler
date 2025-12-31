import { FirestoreEvent, DocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const gradeSubmissionHandler = async (event: FirestoreEvent<DocumentSnapshot | undefined>) => {
    const db = getDb();
    const snapshot = event.data;
    if (!snapshot) return;

    const result = snapshot.data();
    if (!result) return;

    const templateId = result.templateId;
    
    // Fetch template to get correct answers
    const tmplSnap = await db.collection("assessment_templates").doc(templateId).get();
    if (!tmplSnap.exists) return;
    
    // const template = tmplSnap.data(); // Use this for actual grading
    let score = 0;
    
    await snapshot.ref.update({
        finalScore: score,
        status: 'graded'
    });
};

export const detectAnomaliesHandler = async (event: FirestoreEvent<DocumentSnapshot | undefined>) => {
    // Logic for trend detection
};
