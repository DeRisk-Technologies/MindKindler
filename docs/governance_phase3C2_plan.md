# Governance Phase 3C-2 Plan: Enterprise Policy Management

## Objective
Enhance the governance module to support **Versioning**, **Conflict Detection**, **Simulation Mode**, and **Compliance Analytics**. This upgrade transitions the system from a basic rule engine to an enterprise-grade policy management platform.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PolicyRule (Update):**
    - `version`: number
    - `status`: 'active' | 'draft' | 'deprecated' | 'archived'
    - `supersedesRuleId`: string | null
    - `supersededByRuleId`: string | null
    - `effectiveFrom`: string | null
    - `rolloutMode`: 'live' | 'simulate'
- [ ] **PolicyConflict (New):**
    - `id`, `tenantId`, `detectedAt`, `severity`, `conflictType`
    - `ruleIds`: string[]
    - `description`: string
    - `status`: 'open' | 'resolved'

## 2. Policy Hygiene Engine (Conflict Detection)
**Path:** `src/ai/guardian/conflicts.ts`

- [ ] **Logic:**
    - Detect duplicates (Same title + jurisdiction + multiple active).
    - Detect collisions (Same trigger + mixed enforcement modes).
    - Detect missing fields (Enforce mode without remediation).
- [ ] **Trigger:** Run validation before publishing a rule.

## 3. Simulation Mode & Guardian Engine Update
**Path:** `src/ai/guardian/engine.ts`

- [ ] **Logic:**
    - If `rule.rolloutMode === 'simulate'`, generate finding but **force** `blocking: false`.
    - Add `simulated: true` flag to the finding.
- [ ] **UI:** Update `GuardianFindingsDialog` to show a "Simulated" badge on findings.

## 4. Policy Manager UI Enhancements
**Path:** `src/app/dashboard/intelligence/policy-manager/page.tsx`

- [ ] **Versioning:** Group rules by "Root ID" or Title. Show version history.
- [ ] **Actions:** Add "Create New Version", "Rollback", "Archive".
- [ ] **Rollout Toggle:** Switch between "Simulate" and "Live" modes.
- [ ] **Health Check:** Add "Check Conflicts" button calling the Hygiene Engine.

## 5. Compliance Analytics Dashboard
**Path:** `src/app/dashboard/intelligence/analytics/page.tsx`

- [ ] **Charts (Recharts):**
    - Findings by Severity (Bar).
    - Top Triggering Rules (List).
    - Override Stats (Pie).
- [ ] **Data Source:** Aggregate query on `guardianFindings`.

## 6. Execution Steps
1.  **Schema**: Update types.
2.  **Engine**: Update Guardian to handle Simulation mode.
3.  **Conflict Logic**: Implement `conflicts.ts`.
4.  **UI**: Build Analytics Dashboard.
5.  **UI**: Upgrade Policy Manager with Versioning/Simulation controls.
6.  **Nav**: Add Analytics link to Hub.

## Manual Test Checklist
- [ ] **Simulation**: Set a blocking rule to "Simulate". Trigger it. Verify finding appears but action proceeds.
- [ ] **Versioning**: "Edit" an active rule -> Save as New Version. Verify old one is deprecated.
- [ ] **Analytics**: Trigger a few findings. Check the Analytics dashboard for counts.
- [ ] **Conflict**: Create two identical rules. Run "Check Conflicts". Verify warning.
