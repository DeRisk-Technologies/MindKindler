# Governance Phase 3D-3A Plan: Outcome Intelligence

## Objective
Implement **Intervention Outcome Scoring**, **Review Checkpoints**, and **Analytics Dashboards**. This phase closes the feedback loop by allowing EPPs to track whether interventions are actually working and visualizing impact at scale.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **InterventionPlan (Update):**
    - `baselineScore` (0-100), `targetScore` (0-100), `currentScore` (0-100).
    - `outcomeStatus`: 'improving' | 'stable' | 'worsening' | 'unknown'.
    - `reviewCheckpoints`: Array of `{ date, plannedFocus, status }`.
    - `schoolId`: string (for aggregation).
- [ ] **ProgressLog (Update):**
    - `scoreDelta` (number), `outcomeNote` (string).

## 2. Analytics Engine
**Path:** `src/analytics/interventions.ts` (New)

- [ ] **Functions:**
    - `calculateOutcomeStats(plans[])`: Returns Active/Completed counts, % Improving.
    - `getTopInterventions(plans[])`: Ranks `recommendationTemplates` by avg `scoreDelta`.
- [ ] **Scope:** Client-side aggregation for Phase 3D (scalable enough for <5000 plans).

## 3. Dashboard UI: EPP Outcomes
**Path:** `src/app/dashboard/insights/outcomes/page.tsx`

- [ ] **KPI Cards:** Active Plans, Success Rate (% Improving), Avg Score Gain.
- [ ] **Charts (Recharts):**
    - Outcome Distribution (Pie: Improving vs Stable vs Worsening).
    - Monthly Improvement Trend (Line).
- [ ] **"What Works" Table:** Top interventions sorted by impact.

## 4. Dashboard UI: School Outcomes
**Path:** `src/app/dashboard/insights/schools/page.tsx`

- [ ] **Aggregated View:** Same KPIs but filtered by `schoolId` (mock selection for EPP view).
- [ ] **Privacy:** No student names in the "What Works" list.

## 5. Intervention Detail Updates
**Path:** `src/app/dashboard/students/[id]/interventions/[planId]/page.tsx`

- [ ] **Score Tracking UI:** Input fields for Baseline/Target/Current scores.
- [ ] **Checkpoint UI:** Add/Edit review dates.
- [ ] **Progress Log Update:** Add score change input when logging progress.

## 6. Exportable Report
- [ ] **Action:** Button in Dashboards "Export Insight Report".
- [ ] **Format:** Simple HTML print view (reuse Report Builder pattern or simple `window.print`).

## 7. Execution Steps
1.  **Schema**: Update `InterventionPlan`.
2.  **Engine**: Build `src/analytics/interventions.ts`.
3.  **Detail UI**: Update Plan Detail page to support scoring.
4.  **Dashboards**: Build EPP and School Insight pages.
5.  **Nav**: Add "Insights" section to Sidebar.

## Manual Test Checklist
- [ ] **Score**: Open an Intervention Plan. Set Baseline 40, Target 80.
- [ ] **Log**: Add progress log with score +10. Verify `currentScore` updates to 50.
- [ ] **Dashboard**: Go to "Insights > My Outcomes". Verify the "Improving" count increments.
- [ ] **School View**: Switch to School Dashboard. Verify aggregated stats match.
