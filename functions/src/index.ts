import { onCall } from "firebase-functions/v2/https";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

import * as aiReports from "./ai/generateClinicalReport";
import * as aiAssessments from "./ai/generateAssessmentContent";
import * as aiInsights from "./ai/analyzeConsultationInsight";
import * as scheduling from "./scheduling/scheduler";
import * as grading from "./assessments/grading";
import * as userMgmt from "./admin/userManagement";
import * as maintenance from "./admin/dataMaintenance";

// Set Global Options for 2nd Gen and Region
setGlobalOptions({ region: "europe-west3", maxInstances: 10 });

// Ensure initializeApp is called only once
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// 1. AI & Intelligence Layer
export const generateClinicalReport = onCall(aiReports.handler);
export const generateAssessmentContent = onCall(aiAssessments.handler);
export const analyzeConsultationInsight = onCall(aiInsights.handler);

// 2. Scheduling & Workflow Automation
export const findAvailabilitySlots = onCall(scheduling.findAvailabilityHandler);
export const onAppointmentChange = onDocumentWritten('appointments/{apptId}', scheduling.onAppointmentChangeHandler);
export const sendDailyReminders = onSchedule({ schedule: 'every day 06:00', timeZone: 'Europe/Berlin' }, scheduling.sendDailyRemindersHandler);

// 3. Assessment & Grading
export const gradeAssessmentSubmission = onDocumentCreated('assessment_results/{resultId}', grading.gradeSubmissionHandler);
export const detectAnomalies = onDocumentCreated('assessment_results/{resultId}', grading.detectAnomaliesHandler);

// 4. Admin & Data Maintenance
export const anonymizeTrainingData = onSchedule({ schedule: '0 0 1 * *', timeZone: 'Europe/Berlin' }, maintenance.anonymizeDataHandler);

// Converted to Callable to bypass Auth Trigger configuration issues
export const setupUserProfile = onCall(userMgmt.setupUserProfileHandler);
