# Governance Phase 3B-1 Plan

## Objective
Implement **Guardian AI (Advisory Mode)** and **Structured Policy Rules** to provide automated compliance checks during key workflows. This phase focuses on deterministic rule evaluation and surfacing non-blocking advisories.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PolicyRule:** Structured compliance rule definition.
- [ ] **GuardianFinding:** Result of a compliance check.
- [ ] **GuardianEvent:** Log of an evaluated event.

## 2. Guardian Engine (Logic)
**Path:** `src/ai/guardian` (New Folder)

- [ ] **`engine.ts`**: Core logic to evaluate rules against an event context.
    - `evaluateEvent(eventType, context) -> findings[]`
- [ ] **`triggers.ts`**: Library of deterministic check functions.
    - `checkConsent(context)`
    - `checkMetadata(context)`
    - `checkPII(context)`

## 3. UI - Governance Administration
**Path:** `src/app/dashboard/intelligence`

- [ ] **`policy-manager/page.tsx`**: List and CRUD for Policy Rules.
- [ ] **`compliance/page.tsx`**: Dashboard for Guardian Findings (Admin view).

## 4. Integration Hooks (The "Guardrails")

- [ ] **Assessment Finalize Hook:**
    - File: `src/app/dashboard/assessments/results/[id]/page.tsx`
    - Action: Call `evaluateEvent` on finalize.
    - UI: Show `GuardianFindingsDialog` if issues found.
- [ ] **Document Upload Hook:**
    - File: `src/components/dashboard/intelligence/document-upload-dialog.tsx`
    - Action: Call `evaluateEvent` after index.
    - UI: Toast warning if issues found.

## 5. Components
- [ ] **`GuardianFindingsDialog`**: Reusable modal to display warnings and capture acknowledgments.

## 6. Execution Steps
1.  **Schema**: Update `src/types/schema.ts` with Policy/Guardian types.
2.  **Engine**: Implement `src/ai/guardian/engine.ts` with mock triggers.
3.  **Admin UI**: Create Policy Manager & Compliance Dashboard pages.
4.  **Hooks**: Integrate engine into Assessment Finalize & Document Upload flows.
5.  **Audit**: Ensure findings are logged.

## Manual Test Checklist
- [ ] **Create Rule**: Admin creates a rule "Always require consent for assessments" (Trigger: `assessment.finalize`).
- [ ] **Trigger Rule**: Finalize an assessment without consent flag (mock context).
- [ ] **Verify Advisory**: See "Guardian Warning" modal.
- [ ] **Resolve**: Admin marks finding as resolved in Compliance Dashboard.
