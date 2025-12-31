# Government Intelligence Phase 4B-2 Plan: Rollout & Onboarding Toolkit

## Objective
Enable governments and large organizations to manage the **Rollout** of MindKindler at scale. This module introduces **Rollout Programs**, **Cohorts**, and **Readiness Scoring** to track adoption health across councils, states, or federal entities.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **RolloutProgram (New):**
    - `id`, `tenantId`, `scopeType`, `scopeId`, `name`
    - `status`: 'planning' | 'active' | 'completed'
    - `startDate`, `targetGoLiveDate`
- [ ] **RolloutCohort (New):**
    - `id`, `programId`, `name`, `audience` (Teachers/EPPs)
    - `userIds`[], `assignedTrainingPathId`
    - `completionRate`: number (computed)
- [ ] **RolloutChecklist (New):**
    - `id`, `programId`, `category` (Governance, Training, Data)
    - `items`: { title, required, status, owner }[]
- [ ] **ReadinessSnapshot (New):**
    - `id`, `programId`, `score` (0-100), `breakdown` (JSON)
    - `computedAt`

## 2. Readiness Engine
**Path:** `src/govintel/rollout/readiness.ts` (New)

- [ ] **`computeReadiness(programId)`**:
    - Aggregates:
        - **Governance**: % of mandatory policies active.
        - **Training**: % cohort completion of assigned paths.
        - **Operations**: Active user count vs licensed seats.
    - Returns `score` (0-100) and `risks` array.

## 3. UI Implementation
**Path:** `src/app/dashboard/govintel/rollout` (New Module)

- [ ] **List Page (`/page.tsx`)**:
    - View active programs.
    - "Create Program" Wizard.
- [ ] **Program Dashboard (`/[id]/page.tsx`)**:
    - **Readiness Scorecard**: Visual gauge/score.
    - **Adoption Metrics**: Active users, assessments created.
    - **Checklist Widget**: Categories (Governance, Training, etc.) with progress bars.
- [ ] **Checklist Manager (`/[id]/checklist/page.tsx`)**:
    - Add/Edit items.
    - Mark status (Done/Blocked).
- [ ] **Cohort Manager (`/[id]/cohorts/page.tsx`)**:
    - Create Cohort -> Select Users -> Assign Learning Path.
    - View progress of each cohort.

## 4. Integration
- [ ] **Training**: When a Cohort is created/updated, auto-generate `TrainingAssignment` records for all members.
- [ ] **Export**: "Export Go-Live Pack" button generating an HTML summary of readiness.

## 5. Execution Steps
1.  **Schema**: Add Rollout types.
2.  **Engine**: Implement `readiness.ts`.
3.  **UI**: Build Program List & Dashboard.
4.  **UI**: Build Checklist & Cohort managers.
5.  **Integration**: Connect Cohorts to Training Assignments.

## Manual Test Checklist
- [ ] **Create Program**: "Council A Rollout".
- [ ] **Checklist**: Add "Define Policies" item. Mark as Done.
- [ ] **Cohort**: Create "Pilot Teachers". Assign "Safeguarding Basics" path.
- [ ] **Assignment**: Verify assignments appear in `TrainingAssignments` collection.
- [ ] **Readiness**: Click "Run Check". Verify score updates based on checklist progress.
- [ ] **Export**: Generate the Go-Live report.
