# Governance Phase 3B-2C Plan: Safeguarding, Jurisdiction Packs & Advanced Policy UI

## Objective
Complete the Governance foundation by implementing the **Safeguarding Workflow**, enabling **Jurisdiction Packs**, and upgrading the **Policy Manager UI** to fully support enforcement controls. This phase ensures the system is not just technically capable of enforcement, but user-ready for real-world compliance scenarios.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **SafeguardingIncident (New):**
    - `id`, `tenantId`, `createdByUserId`, `createdAt`, `updatedAt`
    - `subjectStudentId`, `severity`, `category`, `status`, `description`
    - `assignedToUserId`, `evidenceFiles`[], `timelineEvents`[]

## 2. Policy Manager Upgrade (Advanced Editor)
**Path:** `src/app/dashboard/intelligence/policy-manager/page.tsx`

- [ ] **UI:** Update the "Create/Edit Rule" dialog to expose:
    - **Mode Toggle:** Advisory vs Enforce (with warning modal).
    - **Blocking Toggle:** `blockActions` checkbox.
    - **Action Selector:** Multi-select for `appliesToActions` (e.g., `assessment.finalize`).
    - **Overrides:** `allowOverride` checkbox.
- [ ] **Logic:** Ensure these fields are saved to Firestore `policyRules`.

## 3. Jurisdiction Packs
**Path:** `src/ai/guardian/packs/` (New Folder)

- [ ] **Create JSON Packs:**
    - `uk.json`: KCSIE rules (Safeguarding + Consent).
    - `us.json`: FERPA rules (Consent + Access Log).
    - `eu_gdpr.json`: GDPR rules (Processing Consent + Minimization).
- [ ] **Import Flow:** Add "Import Pack" button to Policy Manager.
    - Parses JSON and batch creates rules in Firestore.

## 4. Safeguarding Workflow
**Path:** `src/app/dashboard/intelligence/safeguarding` (New Module)

- [ ] **List Page (`/page.tsx`):** Table of incidents with status badges and filters.
- [ ] **Detail Page (`/[id]/page.tsx`):** Full incident view with timeline and actions (Escalate, Close).
- [ ] **Create Dialog:** Standard form to report an issue.

## 5. Guardian Integration (Safeguarding Trigger)
**Path:** `src/ai/guardian/triggers.ts`

- [ ] **New Trigger:** `safeguarding_recommended`.
    - Checks `event.context.text` for high-risk keywords.
    - Returns advisory finding if matched.
- [ ] **UI Update:** Update `guardian-findings-dialog.tsx` to show a "Create Incident" button if this specific finding type is present.

## 6. Navigation
**Path:** `src/app/dashboard/intelligence/page.tsx` (Hub)

- [ ] Ensure all new modules (Safeguarding, Policy Manager, Compliance) are linked clearly.

## 7. Execution Steps
1.  **Schema**: Add Safeguarding types.
2.  **Packs**: Create JSON files.
3.  **Policy UI**: Upgrade the editor form.
4.  **Safeguarding UI**: Build List and Detail pages.
5.  **Integration**: Add Safeguarding trigger to Guardian and "Create Incident" button to Findings Dialog.
6.  **Nav**: Polish Hub links.

## Manual Test Checklist
- [ ] **Policy Editor**: Create a rule with `mode: enforce` via the UI. Verify fields in Firestore.
- [ ] **Import Pack**: Click "Import UK Pack". Verify new rules appear in the list.
- [ ] **Safeguarding**: Create an incident manually. Assign it to yourself. Close it.
- [ ] **Guardian Trigger**: In an assessment, write "harm" in an essay answer (mock trigger). Finalize. Verify "Safeguarding Recommended" warning appears with "Create Incident" button.
