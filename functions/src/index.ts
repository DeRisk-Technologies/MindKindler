// functions/src/index.ts
import { onCall, HttpsOptions, HttpsError } from "firebase-functions/v2/https";
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
import { generatePolicyMemoFlow } from "./ai/flows/generatePolicyMemo";
// Import Grading Flow
import { scoreOpenTextResponseFlow } from "./ai/flows/grading";
import { handler as chatHandler } from "./ai/chatWithCopilot";

export const generateClinicalReport = onCall(callOptions, aiReports.handler);
export const analyzeConsultationInsight = onCall(callOptions, aiInsights.handler);
export const generateAssessmentContent = onCall(callOptions, aiAssessments.handler);

// Correctly exporting the background trigger (not wrapping in onCall)
export const processUploadedDocument = docProcessing.processDocumentTrigger;

export const chatWithCopilot = onCall(callOptions, chatHandler);

export const generatePolicyMemo = onCall(callOptions, async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { tenantId, snapshotData, focusArea } = req.data;
    return await generatePolicyMemoFlow(tenantId, snapshotData, focusArea, req.auth.uid);
});

// NEW: Grading AI
export const gradeOpenText = onCall(callOptions, async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { tenantId, question, studentAnswer, rubric, maxPoints } = req.data;
    return await scoreOpenTextResponseFlow(tenantId, question, studentAnswer, rubric, maxPoints, req.auth.uid);
});

// ... (Rest of existing exports)
import { clearDemoDataHandler } from "./admin/clearData";
import { seedDemoDataHandler } from "./admin/seedData";
import { setupUserProfileHandler } from "./admin/userManagement";
import { anonymizeDataHandler } from "./admin/dataMaintenance";

export const clearDemoData = onCall(callOptions, clearDemoDataHandler);
export const seedDemoData = onCall(callOptions, seedDemoDataHandler);
export const setupUserProfile = onCall(callOptions, setupUserProfileHandler);
export const anonymizeTrainingData = onSchedule({
    schedule: "0 0 1 * *", 
    region
}, anonymizeDataHandler);

import { gradeSubmissionHandler, detectAnomaliesHandler } from "./assessments/grading";

export const gradeAssessmentSubmission = onDocumentCreated({
    document: "assessment_results/{resultId}",
    region
}, gradeSubmissionHandler);

export const detectAnomalies = onDocumentUpdated({
    document: "assessment_results/{resultId}",
    region
}, detectAnomaliesHandler);

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

import { onAlertCreated } from "./case/autoCreateFromAlerts";
import { slaEscalator } from "./case/slaEscalator";

export const autoCreateCaseFromAlert = onAlertCreated; 
export const caseSlaEscalator = slaEscalator;

import { syncExternalData as syncHandler } from "./integrations/syncEngine";
export const syncExternalData = onCall(callOptions, syncHandler);

import { exportReport as exportReportHandler } from "./reports/exportReport";
import { processBulkManifest as bulkImportHandler } from "./upload/bulkImport";

export const exportReport = exportReportHandler; 
export const processBulkManifest = bulkImportHandler;

// Student 360 Secure Endpoints
import { handler as getStudent360Handler } from "./student360/getStudent360";
import { handler as processDocumentHandler } from "./student360/ocr/processDocument";
import { handler as guardianCheckHandler } from "./student360/guardian/guardianCheck";

export const getStudent360 = onCall(callOptions, getStudent360Handler);
export const processDocumentSecure = onCall(callOptions, processDocumentHandler);
export const guardianCheck = onCall(callOptions, guardianCheckHandler);

// --- Community Features ---
import { onPostCreated, onThreadCreated } from './community/moderation';
export const onCommunityPostCreated = onPostCreated;
export const onCommunityThreadCreated = onThreadCreated;

// --- Integrations & Compliance ---
import { securelyCreateMeeting as secureMeetingHandler, fetchAndPurgeRecordings as purgeHandler } from './integrations/meeting-compliance';
// Note: using onCall v1 style for compatibility if defined that way in the file, or wrapping
export const securelyCreateMeeting = secureMeetingHandler;
export const meetingComplianceWorker = purgeHandler;

// --- Enterprise Provisioning ---
import { provisionTenant } from './enterprise/provisioning';
export const provisionEnterpriseTenant = provisionTenant;

// --- Email Infrastructure ---
import { processEmailQueue as emailQueueHandler } from './services/email';
export const processEmailQueue = emailQueueHandler;

// --- Billing (Stripe) ---
import { createCheckoutSession as checkoutHandler, handleStripeWebhook as webhookHandler } from './billing/stripe-integration';
export const createStripeCheckout = checkoutHandler;
export const stripeWebhook = webhookHandler;
