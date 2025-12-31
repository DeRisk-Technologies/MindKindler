# Governance Phase 3B-2B Plan: Enforcement & Overrides

## Objective
Upgrade the Guardian system to support **Blocking Actions** (Enforcement Mode) and implement an **Override Request Workflow**. This ensures critical compliance rules actually stop risky actions unless explicitly authorized.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PolicyRule (Update):**
    - `mode`: 'advisory' | 'enforce' (default advisory)
    - `blockActions`: boolean (default false)
    - `appliesToActions`: string[] (e.g., ['assessment.finalize'])
    - `allowOverride`: boolean (default true)
- [ ] **GuardianOverrideRequest (New):**
    - `id`, `tenantId`, `requestedByUserId`, `requestedAt`
    - `status`: 'pending' | 'approved' | 'rejected'
    - `subjectId`, `ruleIds`[], `findingIds`[]
    - `reason`: string

## 2. Guardian Engine Upgrade
**Path:** `src/ai/guardian/engine.ts`

- [ ] Update `evaluateEvent` to perform specific checks:
    - Identify findings where `rule.mode === 'enforce'` AND `rule.blockActions === true` AND `severity === 'critical'`.
    - Check if a valid (approved) **Override Request** exists for this `subjectId` + `ruleId` combo.
    - If blocked and no override: Return `canProceed: false` and list `blockingFindings`.

## 3. UI Implementation

### A. Assessment Finalize Enforcement
**Path:** `src/app/dashboard/assessments/results/[id]/page.tsx`

- [ ] Update `finalizeAssessment`:
    - Check `findings[0].blocking`.
    - If blocked, show **Blocking Dialog** instead of generic warning.

### B. Findings Dialog Upgrade
**Path:** `src/components/dashboard/intelligence/guardian-findings-dialog.tsx`

- [ ] Add "Blocked" visual state (Red header).
- [ ] If blocked:
    - Hide "Continue" button.
    - Show "Request Override" form (Textarea for reason + Submit).
    - If override submitted: Show "Pending Approval" state.

### C. Compliance Dashboard Upgrade
**Path:** `src/app/dashboard/intelligence/compliance/page.tsx`

- [ ] Add **Override Requests** tab.
- [ ] List pending requests.
- [ ] Actions: Approve / Reject.
- [ ] Logic: Approving creates/updates the `guardianOverrideRequests` doc status.

### D. Document Upload Visibility Enforcement
**Path:** `src/components/dashboard/intelligence/document-upload-dialog.tsx`

- [ ] Add check for `document.upload` event.
- [ ] If blocked (e.g., Public visibility prohibited):
    - Prevent upload.
    - Show error toast or blocking dialog.

## 4. Execution Steps
1.  **Schema**: Update types.
2.  **Engine**: Update `evaluateEvent` logic (Enforcement + Override Check).
3.  **UI Components**: Upgrade `GuardianFindingsDialog` to handle blocking/overrides.
4.  **Admin UI**: Add Overrides tab to Compliance Dashboard.
5.  **Integration**: Update Assessment Finalize to respect blocking signal.
6.  **Integration**: Update Document Upload to respect blocking signal.

## Manual Test Checklist
- [ ] **Configure Rule**: Set "Assessment Consent" rule to `mode: enforce`, `severity: critical`.
- [ ] **Trigger Block**: Try to finalize an assessment without consent. Verify "Action Blocked" modal appears with no "Continue" button.
- [ ] **Request Override**: Fill out reason in modal, submit.
- [ ] **Approve**: Go to Compliance Dashboard -> Overrides -> Approve.
- [ ] **Retry**: Go back to Assessment -> Finalize. It should now proceed (as the engine finds the approved override).
