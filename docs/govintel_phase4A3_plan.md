# Government Intelligence Phase 4A-3 Plan: Capacity & Budget Planner

## Objective
Implement a **Capacity & Budget Planner** that allows government officials to model staffing needs, simulate backlog reduction scenarios, and estimate budgets based on operational data (`govSnapshots`). This module supports "What-If" scenario comparison and exportable planning reports.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PlanningAssumption (New):**
    - `id`, `tenantId`, `scopeType`, `scopeId`
    - `avgHoursPerAssessment`, `avgHoursPerIntervention`, `avgHoursPerSafeguarding`
    - `hoursPerEppPerMonth`, `salaryMonthlyEpp`
    - `targetBacklogReductionPercent`
- [ ] **PlanningScenario (New):**
    - `id`, `tenantId`, `name`, `baseSnapshotRef`
    - `modifiers`: { `referralIncreasePercent`, `staffingIncreaseEpps`, ... }
    - `computedOutputs`: { `requiredEpps`, `totalBudget`, `backlogClearanceMonths` }
    - `status`: 'draft' | 'saved'
- [ ] **GovPlan (New):**
    - `id`, `snapshotRef`, `scenarioIds`[], `contentHtml`

## 2. Planning Engine (Logic)
**Path:** `src/govintel/planner/model.ts` (New)

- [ ] **`computeWorkload(snapshot, assumptions)`**: Calculates total hours required based on snapshot metrics * assumptions.
- [ ] **`computeCapacity(currentStaff, assumptions)`**: Calculates available hours.
- [ ] **`runSimulation(snapshot, assumptions, modifiers)`**: Returns projected KPIs (Budget, Staffing Gap, Backlog Time) for a specific scenario.

## 3. UI Implementation
**Path:** `src/app/dashboard/govintel/planner`

- [ ] **Baseline View (`/page.tsx`):**
    - **Assumptions Editor**: Form to tweak unit costs and time estimates.
    - **Baseline Results**: Cards showing current "As-Is" state (e.g., "Understaffed by 2 EPPs").
    - **Snapshot Selector**: Pick which month's data to model against.
- [ ] **Scenario Manager (`/scenarios/page.tsx`):**
    - **Create Scenario**: Sliders for "Referral Growth" and "Hiring".
    - **Comparison Table**: Side-by-side view of Baseline vs Scenario A vs Scenario B.
    - **Actions**: "Save Scenario", "Create Action" (e.g., Hire Staff).

## 4. Integration
- [ ] **GovAction**: Add button to convert a planning result (e.g., "Hire 5 EPPs") into a tracked `GovAction`.
- [ ] **Export**: Generate HTML report of the plan.

## 5. Execution Steps
1.  **Schema**: Define new types.
2.  **Engine**: Implement the math in `model.ts`.
3.  **UI**: Build Baseline Planner & Assumptions form.
4.  **UI**: Build Scenario Modeling & Comparison view.
5.  **Integration**: Connect "Create Action" and "Export".

## Manual Test Checklist
- [ ] **Configure**: Set assumptions (e.g., Assessment = 5 hours).
- [ ] **Baseline**: View baseline calculation.
- [ ] **Scenario**: Create "High Growth" scenario (+20% referrals). Verify "Required EPPs" increases.
- [ ] **Compare**: Compare Baseline vs High Growth.
- [ ] **Action**: Click "Create Action" to hire staff based on the plan.
