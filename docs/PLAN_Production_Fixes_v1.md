# Plan: Production Fixes & Hardening (v1)

**Date:** January 17, 2026
**Objective:** Address 11 critical issues identified during UAT/Handoff to reach Production Grade.

## 1. High Priority: Access & Permissions

### 1.1 Parent Creation Form (`src/components/student360/ParentEntryForm.tsx`)
*   **Issue:** Permission error (likely TenantID or Region mismatch).
*   **Fix:**
    *   Verify `useFirestore` is initialized with the correct region.
    *   Ensure `tenantId` is being passed to the `add()` call.
    *   Check `firestore.rules` for `parents` or `contacts` collection.

### 1.2 Assessment Permissions (`src/components/assessments/forms/WiscVEntryForm.tsx`, `ai-generator-dialog.tsx`)
*   **Issue:** "Insufficient permissions" on save/load. No templates visible.
*   **Fix:**
    *   Check `assessments` and `assessment_results` rules in `firestore.rules`.
    *   Verify `tenantId` injection in the save payload.
    *   **Templates:** debug `src/components/assessments/DynamicAssessmentSelector.tsx` or equivalent to see why templates aren't loading (check `assessment_templates` collection vs hardcoded).

### 1.3 Case File Upload (`src/components/dashboard/case/tabs/case-files.tsx`)
*   **Issue:** "Upload failed".
*   **Fix:**
    *   Check if it's using Firebase Storage directly or an API route.
    *   Verify Storage Rules (`firebase.json` or console, but we can only edit code).
    *   Ensure path includes `tenantId`.

## 2. Core Workflow: Workbench & Consultation

### 2.1 Work Schedule (`src/components/dashboard/case/tabs/case-schedule.tsx`)
*   **Issue:** Checkbox bug (select one selects all), No Notes, No Subtasks.
*   **Fix:**
    *   **Checkbox:** Fix `key` or `id` collision in the `.map` loop.
    *   **Notes:** Add `notes` field to the Add Task Dialog.
    *   **Subtasks:** Update `CaseTask` type in `src/types/case.ts` to include `subtasks: { id, title, completed }[]`.
    *   **Appointments:** Fetch from `appointments` collection and render in the side panel.

### 2.2 Reporting Tab (`src/components/dashboard/case/tabs/case-reports.tsx`)
*   **Issue:** Old builder shown.
*   **Fix:** Swap import to `src/app/dashboard/reports/builder/page.tsx` (or the component version of it, likely `src/components/reporting/ReportEditor.tsx`).

### 2.3 Consultation & Session Linking
*   **Files:** `src/components/dashboard/case/tabs/case-evidence.tsx`, `src/components/consultations/LiveCockpit.tsx`, `src/components/consultations/PostSessionSynthesis.tsx`.
*   **Features:**
    *   **Scheduling:** Add "Start Zoom" / "Start Teams" buttons (using existing API keys).
    *   **Linking:** Ensure `startSession` and `endSession` calls include `caseId`.
    *   **Artifacts:** Allow upload of external recordings/notes.

## 3. Data Model & Features

### 3.1 Stakeholders (`src/components/dashboard/case/tabs/case-files.tsx` / `StakeholderMapper.tsx`)
*   **Issue:** Limited roles.
*   **Fix:** Update `StakeholderRole` in `src/types/case.ts` with full list (Father, Mother, Grandparents, etc.). Update the dropdown UI.

### 3.2 Consent Module (`src/app/dashboard/students/[id]/consent/page.tsx`)
*   **Issue:** Verify existence and link generation.
*   **Fix:**
    *   If page exists, ensure it generates a shareable link (e.g., `/portal/consent/[token]`).
    *   If not, implement basic "Copy Link" that points to a public consent form.

### 3.3 Activity Journal (`src/services/telemetry-service.ts` or similar)
*   **Issue:** Audit logging.
*   **Fix:** Ensure `logActivity` is called for session start/end and saves to a `case_activities` or global `audit_log` collection.

## 4. Component Upgrades

### 4.1 Calendar (`src/app/dashboard/appointments/calendar/page.tsx`)
*   **Issue:** "Upgrade to production grade".
*   **Fix:** Ensure it uses a robust calendar library (e.g., `react-big-calendar` or FullCalendar wrapper if available, or just improve the custom one) and fetches real `appointments`.

## Execution Order
1.  **Fix Permissions (Parent, Assessments, Uploads)** - *Unblocks testing.*
2.  **Fix Work Schedule (UI bugs)** - *Quick win.*
3.  **Update Stakeholders** - *Data model change.*
4.  **Fix Reporting Tab** - *Swap component.*
5.  **Fix Consultation/Session Logic** - *Complex logic.*
6.  **Consent & Calendar** - *New/Upgrade features.*
