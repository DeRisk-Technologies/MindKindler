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
import { scoreOpenTextResponseFlow } from "./ai/flows/grading";
import { handler as chatHandler } from "./ai/chatWithCopilot";

export const generateClinicalReport = onCall(callOptions, aiReports.handler);
export const analyzeConsultationInsight = onCall(callOptions, aiInsights.handler);
export const generateAssessmentContent = onCall(callOptions, aiAssessments.handler);
export const processUploadedDocument = docProcessing.processDocumentTrigger;
export const chatWithCopilot = onCall(callOptions, chatHandler);

export const generatePolicyMemo = onCall(callOptions, async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { tenantId, snapshotData, focusArea } = req.data;
    return await generatePolicyMemoFlow(tenantId, snapshotData, focusArea, req.auth.uid);
});

export const gradeOpenText = onCall(callOptions, async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { tenantId, question, studentAnswer, rubric, maxPoints } = req.data;
    return await scoreOpenTextResponseFlow(tenantId, question, studentAnswer, rubric, maxPoints, req.auth.uid);
});

// --- Admin & Data Maintenance ---
import { setupUserProfileHandler } from "./admin/userManagement";
import { anonymizeDataHandler } from "./admin/dataMaintenance";
import { provisionTenantDataHandler } from "./admin/provisioning";
import { checkSystemHealthHandler } from "./admin/healthCheck";

export const setupUserProfile = onCall(callOptions, setupUserProfileHandler);
export const anonymizeTrainingData = onSchedule({
    schedule: "0 0 1 * *", 
    region
}, anonymizeDataHandler);

// Unified Provisioning Engine (Phase 32)
export const provisionTenantData = onCall(callOptions, provisionTenantDataHandler);

// System Diagnostics (Phase 35)
export const checkSystemHealth = onCall(callOptions, checkSystemHealthHandler);

// Legacy Adapters (For backward compatibility with existing clients)
export const seedDemoData = onCall(callOptions, async (req) => {
    req.data = { ...req.data, action: 'seed_pilot_uk' };
    return provisionTenantDataHandler(req);
});

export const clearDemoData = onCall(callOptions, async (req) => {
    req.data = { ...req.data, action: 'clear_all', confirmation: true };
    return provisionTenantDataHandler(req);
});

// --- Grading & Assessment ---
import { gradeSubmissionHandler, detectAnomaliesHandler } from "./assessments/grading";

export const gradeAssessmentSubmission = onDocumentCreated({
    document: "assessment_results/{resultId}",
    region
}, gradeSubmissionHandler);

export const detectAnomalies = onDocumentUpdated({
    document: "assessment_results/{resultId}",
    region
}, detectAnomaliesHandler);

// --- Scheduling ---
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

// --- Case Management ---
import { onAlertCreated } from "./case/autoCreateFromAlerts";
import { slaEscalator } from "./case/slaEscalator";

export const autoCreateCaseFromAlertV2 = onAlertCreated; 
export const caseSlaEscalatorV2 = slaEscalator;

// --- Integrations ---
import { syncExternalData as syncHandler } from "./integrations/syncEngine";
export const syncExternalData = onCall(callOptions, syncHandler);

import { exportReport as exportReportHandler } from "./reports/exportReport";
import { processBulkManifest as bulkImportHandler } from "./upload/bulkImport";

export const exportReport = exportReportHandler; 
export const processBulkManifest = bulkImportHandler;

// --- Student 360 Secure ---
import { handler as getStudent360Handler } from "./student360/getStudent360";
import { handler as processDocumentHandler } from "./student360/ocr/processDocument";
import { handler as guardianCheckHandler } from "./student360/guardian/guardianCheck";

export const getStudent360 = onCall(callOptions, getStudent360Handler);
export const processDocumentSecure = onCall(callOptions, processDocumentHandler);
export const guardianCheck = onCall(callOptions, guardianCheckHandler);

// --- Community ---
import { onPostCreated, onThreadCreated } from './community/moderation';
export const onCommunityPostCreated = onPostCreated;
export const onCommunityThreadCreated = onThreadCreated;

// --- Meeting Compliance ---
import { securelyCreateMeeting as secureMeetingHandler, fetchAndPurgeRecordings as purgeHandler } from './integrations/meeting-compliance';

export const securelyCreateMeetingV2 = secureMeetingHandler;
export const meetingComplianceWorkerV2 = purgeHandler;

// --- Enterprise Provisioning ---
import { provisionTenant } from './enterprise/provisioning';
export const provisionEnterpriseTenantV2 = provisionTenant;

// --- Email ---
import { processEmailQueue as emailQueueHandler } from './services/email';
export const processEmailQueueV2 = emailQueueHandler;

// --- Billing ---
import { createCheckoutSession as checkoutHandler, handleStripeWebhook as webhookHandler } from './billing/stripe-integration';
export const createStripeCheckoutV2 = checkoutHandler;
export const stripeWebhookV2 = webhookHandler;

// --- GovIntel ---
import { aggregateGovStats as aggregateGovStatsHandler } from './govintel/aggregation';
export const aggregateGovStatsV2 = aggregateGovStatsHandler;
