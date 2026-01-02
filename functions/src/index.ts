import { onCall, HttpsOptions } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from 'firebase-admin';

// Initialize Admin
if (!admin.apps.length) admin.initializeApp();

// Configuration
const region = "europe-west3";
const callOptions: HttpsOptions = { region, cors: true };

// --- 1. AI & Core Clinical Functions ---
import * as aiReports from "./ai/generateClinicalReport";
import * as aiInsights from "./ai/analyzeConsultationInsight";
import * as aiAssessments from "./ai/generateAssessmentContent";
import * as docProcessing from "./ai/processUploadedDocument";

export const generateClinicalReport = onCall(callOptions, aiReports.handler);
export const analyzeConsultationInsight = onCall(callOptions, aiInsights.handler);
export const generateAssessmentContent = onCall(callOptions, aiAssessments.handler);
export const processUploadedDocument = docProcessing.processDocumentHandler;

// --- 2. Admin & Seeding ---
import { clearDemoDataHandler } from "./admin/clearData";
import { seedDemoDataHandler } from "./admin/seedData";
import { setupUserProfileHandler } from "./admin/userManagement";
import { anonymizeDataHandler } from "./admin/dataMaintenance";

export const clearDemoData = onCall(callOptions, clearDemoDataHandler);
export const seedDemoData = onCall(callOptions, seedDemoDataHandler);
export const setupUserProfile = onCall(callOptions, setupUserProfileHandler);
export const anonymizeTrainingData = onSchedule({
    schedule: "0 0 1 * *", // Standard cron: Midnight on the 1st of every month
    region
}, anonymizeDataHandler);

// --- 3. Assessments & Grading ---
import { gradeSubmissionHandler, detectAnomaliesHandler } from "./assessments/grading";

export const gradeAssessmentSubmission = onDocumentCreated({
    document: "assessment_results/{resultId}",
    region
}, gradeSubmissionHandler);

export const detectAnomalies = onDocumentUpdated({
    document: "assessment_results/{resultId}",
    region
}, detectAnomaliesHandler);

// --- 4. Scheduling & Reminders ---
import { findAvailabilityHandler, onAppointmentChangeHandler, sendDailyRemindersHandler } from "./scheduling/scheduler";

export const findAvailabilitySlots = onCall(callOptions, findAvailabilityHandler);
export const onAppointmentChange = onDocumentUpdated({
    document: "appointments/{appointmentId}",
    region
}, onAppointmentChangeHandler);

export const sendDailyReminders = onSchedule({
    schedule: "every day 08:00",
    region
}, sendDailyRemindersHandler);

// --- 5. Case Automation & SLA ---
import { onAlertCreated } from "./case/autoCreateFromAlerts";
import { slaEscalator } from "./case/slaEscalator";

export const autoCreateCaseFromAlert = onAlertCreated; 
export const caseSlaEscalator = slaEscalator;

// --- 6. Integrations ---
import { syncExternalData as syncHandler } from "./integrations/syncEngine";
export const syncExternalData = onCall(callOptions, syncHandler);

// --- 7. Reports & Uploads ---
import { exportReport as exportReportHandler } from "./reports/exportReport";
import { processBulkManifest as bulkImportHandler } from "./upload/bulkImport";

export const exportReport = exportReportHandler; 
export const processBulkManifest = bulkImportHandler;
