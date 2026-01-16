# MindKindler Production Hardening Plan

**Date:** January 16, 2026
**Status:** In Progress
**Branch:** `production-hardening`

## Objective
Transition the codebase from "Pilot/Mock" status to "Production-Grade". This involves replacing hardcoded data, console logs, and stubbed services with real implementations, robust error handling, and connection to live services (Firestore, Vertex AI, Stripe, SendGrid, etc.).

## Phase 1: Infrastructure & Backend Services (The "Plumbing")
**Goal:** Ensure external communications and payments are real and logged appropriately.

*   [ ] **Email Service (`functions/src/services/email.ts`)**
    *   Current: Likely uses `console.log` or a stub.
    *   Action: Implement a `sendEmail` function that uses a provider (e.g., SendGrid/Mailgun) via API key from secrets, or writes to a secure `mail_queue` collection for processing by a dedicated trigger (if direct API access is restricted). Implement `sendEmailToUser` properly.
*   [ ] **Billing (`functions/src/billing/stripe-integration.ts`)**
    *   Current: Check for mock webhooks or hardcoded success responses.
    *   Action: Ensure `createCheckoutSession` uses real Stripe API. Ensure `handleStripeWebhook` validates signatures and handles idempotency.
*   [ ] **Meeting Compliance (`functions/src/integrations/meeting-compliance.ts`)**
    *   Current: Likely returns static "Meeting Recorded" strings.
    *   Action: Implement a structure that *could* connect to Zoom/Teams. If API keys are missing, implement a "Soft Fail" or a "Simulation Mode" that stores the request in Firestore `meeting_logs` rather than just returning a string.
*   [ ] **Notifications (`src/lib/notifications.ts` & `functions/src/services/notifications.ts` if exists)**
    *   Current: Check for console logging notifications.
    *   Action: Ensure integration with Firebase Cloud Messaging (FCM) or a robust in-app notification system stored in Firestore (`users/{uid}/notifications`).

## Phase 2: AI Pipelines & Data Ingestion (The "Brain")
**Goal:** Ensure AI functions call Vertex AI/Document AI and process real data.

*   [ ] **Document Extraction (`functions/src/ai/flows/extractDocumentFlow.ts`)**
    *   Current: Verify if it returns hardcoded JSON.
    *   Action: Connect to Document AI or a Gemini Vision parser.
*   [ ] **OCR (`functions/src/student360/ocr/processDocument.ts`)**
    *   Action: Ensure it handles file streams and calls the OCR provider.
*   [ ] **Vector Search (`src/ai/knowledge/ingest.ts`, `retrieve.ts`)**
    *   Current: Stubbed logic.
    *   Action: **Pause & Guide User** on Google Cloud Vertex AI Search setup. Implement the real `embed` and `search` logic using the `google-cloud/discoveryengine` or `firebase-extensions/vector-search`.
*   [ ] **Conflict Detection (`src/ai/guardian/conflicts.ts`)**
    *   Action: Ensure logic actually compares arrays/objects and isn't just a random boolean generator.

## Phase 3: Clinical Dashboard & Data Binding (The "Clinician View")
**Goal:** Replace hardcoded "Jane Doe" data with real Firestore queries.

*   [ ] **Cases (`src/app/dashboard/cases/[id]/page.tsx`, `drafting/page.tsx`)**
    *   Action: Use `useFirestore` / `getRegionalDb` to fetch Case ID `[id]`. Handle 404s.
*   [ ] **Students (`src/app/dashboard/students/[id]/page.tsx`)**
    *   Action: Fetch Student profile from Firestore.
*   [ ] **Appointments (`src/app/dashboard/appointments/calendar/page.tsx`)**
    *   Action: Fetch `appointments` collection for the current user/tenant.
*   [ ] **Components (`src/components/cases/CaseDetail.tsx`, `case-tabs/*.tsx`)**
    *   Action: Remove prop mocks. Ensure components accept data props or fetch their own data.

## Phase 4: GovIntel & Analytics (The "Admin View")
**Goal:** Enable real (or aggregated) analytics instead of static JSON charts.

*   [ ] **GovIntel Pages (`src/app/dashboard/govintel/**`)**
    *   Action: Wire up charts to an `analytics_aggregates` collection. Real-time counting is too slow; we will rely on a scheduled function (from Phase 1/2) to populate these aggregates.
*   [ ] **Snapshots (`src/analytics/govSnapshots.ts`)**
    *   Action: Ensure the snapshot generation logic actually queries the database.

## General "Production-Grade" Rules
1.  **No `console.log` for PII:** Use `functions.logger` with redaction.
2.  **Error Handling:** Try/Catch blocks around all external API calls.
3.  **Types:** No `any` types in core business logic.
4.  **Configuration:** Use `process.env` or Firebase Config, never hardcode keys.
5.  **Seeding:** If a feature relies on data, ensure `src/scripts/seed-pilot-data.ts` can generate it.
