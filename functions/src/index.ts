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
import * as seed from "./admin/seedData";
import * as clear from "./admin/clearData";
import * as integrations from "./integrations/syncEngine";

// Set Global Options for 2nd Gen and Region
setGlobalOptions({ region: "europe-west3", maxInstances: 10 });

// Ensure initializeApp is called only once
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Enable CORS for all Callable Functions
// Using "*" string or array to be explicit
const callOptions = { cors: ["https://mindkindler-84fcf.web.app", "http://localhost:3000"] };

// 1. AI & Intelligence Layer
export const generateClinicalReport = onCall(callOptions, aiReports.handler);
export const generateAssessmentContent = onCall(callOptions, aiAssessments.handler);
export const analyzeConsultationInsight = onCall(callOptions, aiInsights.handler);

// 2. Scheduling & Workflow Automation
export const findAvailabilitySlots = onCall(callOptions, scheduling.findAvailabilityHandler);
export const onAppointmentChange = onDocumentWritten('appointments/{apptId}', scheduling.onAppointmentChangeHandler);
export const sendDailyReminders = onSchedule({ schedule: 'every day 06:00', timeZone: 'Europe/Berlin' }, scheduling.sendDailyRemindersHandler);

// 3. Assessment & Grading
export const gradeAssessmentSubmission = onDocumentCreated('assessment_results/{resultId}', grading.gradeSubmissionHandler);
export const detectAnomalies = onDocumentCreated('assessment_results/{resultId}', grading.detectAnomaliesHandler);

// 4. Admin & Data Maintenance
export const anonymizeTrainingData = onSchedule({ schedule: '0 0 1 * *', timeZone: 'Europe/Berlin' }, maintenance.anonymizeDataHandler);
export const setupUserProfile = onCall(callOptions, userMgmt.setupUserProfileHandler);

// Seed Data - Increased timeout/memory
export const seedDemoData = onCall({ 
    cors: callOptions.cors, 
    timeoutSeconds: 540, 
    memory: "1GiB" 
}, seed.seedDemoDataHandler);

export const clearDemoData = onCall(callOptions, clear.clearDemoDataHandler);

// 5. Integrations
export const syncExternalData = onCall(callOptions, integrations.syncExternalData);
