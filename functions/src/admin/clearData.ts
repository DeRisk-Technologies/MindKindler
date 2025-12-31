import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const getDb = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin.firestore();
};

export const clearDemoDataHandler = async (request: CallableRequest) => {
    const db = getDb();
    
    try {
        const studentsSnap = await db.collection("students").where("schoolId", "==", "sch_demo_1").get();
        const studentIds = studentsSnap.docs.map(d => d.id);
        
        const batch = db.batch();
        let count = 0;

        // Delete Students
        studentsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });

        // Delete associated Results, Cases
        if (studentIds.length > 0) {
            // Assessment Results (chunked for safety if > 10 IDs, but here simplified)
            const resultsSnap = await db.collection("assessment_results").where("studentId", "in", studentIds.slice(0, 10)).get();
            resultsSnap.docs.forEach(doc => { batch.delete(doc.ref); count++; });

            // Cases
            const casesSnap = await db.collection("cases").where("studentId", "in", studentIds.slice(0, 10)).get();
            casesSnap.docs.forEach(doc => { batch.delete(doc.ref); count++; });
        }

        if (count > 0) {
            await batch.commit();
        }

        return { success: true, message: `Deleted ${count} demo records.` };
    } catch (e: any) {
        console.error("Clear Failed", e);
        return { success: false, message: e.message };
    }
};
