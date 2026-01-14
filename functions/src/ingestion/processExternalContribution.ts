// functions/src/ingestion/processExternalContribution.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Initialize if needed
if (!admin.apps.length) admin.initializeApp();

export const processExternalContributionHandler = onDocumentCreated(
    { 
        document: "contribution_submissions/{submissionId}", 
        region: "europe-west3"
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const submission = snapshot.data();
        const submissionId = event.params.submissionId;
        const studentId = submission.studentId;
        const requestId = submission.requestId;

        // Use the Firestore instance that triggered the event (handles multi-db)
        const db = snapshot.ref.firestore;

        console.log(`[Ingestion] Processing submission ${submissionId} for student ${studentId}`);

        try {
            // 1. Fetch Request Metadata to determine Type
            const requestRef = db.collection("contribution_requests").doc(requestId);
            const requestSnap = await requestRef.get();
            
            if (!requestSnap.exists) {
                console.warn(`[Ingestion] Request ${requestId} not found. Skipping.`);
                return;
            }

            const requestType = requestSnap.data()?.type; // 'parent_view' | 'school_advice'
            const data = submission.data || {};
            const tenantId = requestSnap.data()?.tenantId || 'default';

            // 2. Prepare Updates
            const studentRef = db.collection("students").doc(studentId);
            
            if (requestType === 'parent_view') {
                // --- PARENT VIEW INGESTION ---
                console.log(`[Ingestion] Merging Parent Views...`);
                
                // A. Update Core Profile
                await studentRef.set({
                    voice: {
                        parentView: {
                            strengths: data.childStrengths || [],
                            aspirations: data.childAspirations || "",
                            history: data.historyOfNeeds || "",
                            homeSupport: data.homeSupport || "",
                            providedBy: data.respondentName,
                            updatedAt: new Date().toISOString()
                        }
                    },
                    timeline: {
                        history: FieldValue.arrayUnion({
                            id: submissionId,
                            type: 'parent_contribution',
                            summary: `Parent views submitted by ${data.respondentName}`,
                            date: new Date().toISOString(),
                            metadata: { source: 'portal' }
                        })
                    }
                }, { merge: true });

                // B. Create Assessment Result for AI Triangulation
                await db.collection('assessment_results').add({
                    studentId,
                    tenantId,
                    templateId: 'uk_one_page_profile', // Matches Triangulation Engine
                    completedAt: new Date().toISOString(),
                    status: 'completed',
                    responses: {
                        'Strengths': data.childStrengths?.join(', '),
                        'Aspirations': data.childAspirations,
                        'History': data.historyOfNeeds,
                        'Home Support': data.homeSupport,
                        'Respondent': data.respondentName
                    }
                });

            } else if (requestType === 'school_advice') {
                // --- SCHOOL ADVICE INGESTION ---
                console.log(`[Ingestion] Merging School Data...`);

                const newAcademicRecords = (data.attainment || []).map((a: any) => ({
                    id: `portal_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                    studentId,
                    subject: a.subject,
                    grade: a.grade,
                    date: a.date,
                    type: 'Term',
                    source: 'School Portal',
                    metadata: { verified: true, verifiedBy: data.respondentName, source: 'portal' }
                }));

                // A. Update Core Profile
                const updates: any = {
                    'education.attendancePercentage': { 
                        value: Number(data.attendancePercent || 0),
                        metadata: { source: 'portal', verified: true, verifiedAt: new Date().toISOString() }
                    },
                    'behavior.recentStats': {
                        exclusions: Number(data.exclusions || 0),
                        isolations: Number(data.isolations || 0)
                    }
                };

                await studentRef.set(updates, { merge: true });

                if (newAcademicRecords.length > 0) {
                    await studentRef.update({
                        'timeline.academic': FieldValue.arrayUnion(...newAcademicRecords)
                    });
                }
                
                // B. Create Assessment Result for AI Triangulation
                await db.collection('assessment_results').add({
                    studentId,
                    tenantId,
                    templateId: 'uk_school_contribution', // Matches Triangulation Engine
                    completedAt: new Date().toISOString(),
                    status: 'completed',
                    responses: {
                        'Attainment': JSON.stringify(data.attainment),
                        'Interventions': JSON.stringify(data.interventions),
                        'Attendance': `${data.attendancePercent}%`,
                        'Behavior': `FTE: ${data.exclusions}, Isolations: ${data.isolations}`,
                        'Respondent': data.respondentName
                    }
                });
            }

            console.log(`[Ingestion] Success. Student ${studentId} updated and Evidence created.`);

        } catch (error) {
            console.error(`[Ingestion] Error:`, error);
        }
    }
);
