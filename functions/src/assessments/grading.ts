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
    if (!result || result.status !== 'submitted') return; // Only grade submitted

    const templateId = result.templateId;
    
    // Fetch template to get correct answers
    const tmplSnap = await db.collection("assessment_templates").doc(templateId).get();
    
    if (!tmplSnap.exists) {
        console.error(`Template ${templateId} not found for grading.`);
        return;
    }
    
    const template = tmplSnap.data();
    const questions = template?.questions || [];
    const answers = result.answers || {};
    
    let totalScore = 0;
    let maxScore = 0;
    
    questions.forEach((q: any) => {
        const qId = q.id;
        const correct = q.correctAnswer;
        const studentAnswer = answers[qId];
        
        const points = q.points || 1;
        maxScore += points;

        if (studentAnswer === correct) {
            totalScore += points;
        }
    });
    
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    await snapshot.ref.update({
        score: totalScore,
        maxScore: maxScore,
        percentage: Math.round(percentage),
        status: 'graded',
        gradedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Graded Result ${snapshot.id}: ${totalScore}/${maxScore} (${percentage}%)`);
};

export const detectAnomaliesHandler = async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    const after = event.data?.after.data();
    const before = event.data?.before.data();
    
    if (!after || !before) return;
    
    // Simple Anomaly: Score Drop > 20% compared to previous
    // This requires fetching history, which is expensive for a trigger.
    // For V1 hardening, we just check absolute low score.
    
    if (after.percentage < 40 && after.status === 'graded') {
        console.warn(`[Anomaly] Low score detected for student ${after.studentId}`);
        // In prod: Create an Alert or Flag the Student
        const db = getDb();
        await db.collection('alerts').add({
            type: 'academic_risk',
            studentId: after.studentId,
            message: `Assessment score below threshold: ${after.percentage}%`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
    }
};
