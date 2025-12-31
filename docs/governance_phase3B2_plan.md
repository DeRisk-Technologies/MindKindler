# Governance Phase 3B-2 Plan: Enforcement, Consent & Safeguarding

## Objective
Upgrade the Guardian system from "Advisory" to "Enforcement" capable. Implement the data foundations for Consent and Safeguarding to replace mock checks with real compliance logic.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PolicyRule (Update):** Add `blockActions` (boolean), `appliesToActions` (string[]).
- [ ] **Consent (New):** Track permission records.
    - `subjectId`, `consentType`, `status`, `evidence`, `expiresAt`.
- [ ] **SafeguardingIncident (New):** Track safety issues.
    - `severity`, `category`, `status`, `assignedTo`.
- [ ] **GuardianOverrideRequest (New):** Workflow to bypass blocks.
    - `findingId`, `reason`, `status`.

## 2. Guardian Engine Upgrade
**Path:** `src/ai/guardian/engine.ts`

- [ ] Update `evaluateEvent` to determine `canProceed`.
- [ ] Logic: If finding severity is `critical` AND rule mode is `enforce`, set `canProceed = false`.
- [ ] Return structured result: `{ allowed: boolean, findings: GuardianFinding[] }`.

## 3. Consent Module (Real Data)
- [ ] **UI:** Add "Consent" tab to `src/app/dashboard/students/[id]/page.tsx`.
    - List active consents.
    - Button to "Grant Consent" (Create record).
- [ ] **Integration:** Update `src/ai/guardian/triggers.ts` to fetch *real* consent docs from Firestore instead of checking mock context objects.

## 4. Safeguarding Workflow
- [ ] **UI:** Create `src/app/dashboard/intelligence/safeguarding/page.tsx`.
    - List incidents.
    - "Report Incident" dialog.
- [ ] **Integration:** Add `safeguardingRequired` trigger logic to Guardian.

## 5. Jurisdiction Packs
- [ ] Create pack files in `src/ai/guardian/packs/` (uk.json, us.json, eu.json).
- [ ] Add "Import Pack" button to `PolicyManagerPage`.

## 6. UX & Enforcement Hooks
- [ ] **Assessment Finalize:** Update logic to respect `canProceed = false`.
- [ ] **Guardian Dialog:** Update `src/components/dashboard/intelligence/guardian-findings-dialog.tsx` to support:
    - Red blocking style for critical failures.
    - "Request Override" button.

## 7. Execution Steps
1.  **Schema**: Update types.
2.  **Packs**: Create JSON files.
3.  **Consent UI**: Update Student Profile.
4.  **Safeguarding UI**: Create Safeguarding Dashboard.
5.  **Engine**: Update Guardian logic for enforcement & real DB lookups.
6.  **Hooks**: Update Assessment Finalize to block if needed.
7.  **Admin**: Update Compliance Dashboard to handle overrides.

## Manual Test Checklist
- [ ] **Consent**: Add a consent record for a student.
- [ ] **Enforce**: Create a "Critical" enforcement rule (e.g., "No Assessment without Consent").
- [ ] **Block**: Try to finalize an assessment for a student *without* consent. Verify blocking modal.
- [ ] **Override**: Request override, approve in admin dashboard, try again.
- [ ] **Safeguarding**: Create a new incident log.
