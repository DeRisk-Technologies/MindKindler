# Governance Phase 3D-2 Plan: Recommendations & Interventions

## Objective
Implement a structured **Recommendation & Intervention System**. This allows MindKindler to move beyond just "Assessing" to "Acting", by providing evidence-based next steps that can be tracked over time.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **RecommendationTemplate (New):**
    - `id`, `tenantId`, `title`, `category`, `target` (Student/Teacher/etc.)
    - `description`, `steps`[], `expectedOutcomes`[]
    - `evidenceCitations`[] (Linked to Evidence Vault)
    - `verified` (boolean), `trustScore` (number)
- [ ] **InterventionPlan (New):**
    - `id`, `studentId`, `createdByEppId`, `status` (active/completed)
    - `recommendations`: Array of objects containing:
        - `recommendationId`, `title`, `assignedTo`, `status`, `progressLogs`[]
- [ ] **AssessmentResult (Update):**
    - `generatedRecommendations`: string[] (IDs of suggested templates).

## 2. Recommendation Library UI
**Path:** `src/app/dashboard/intelligence/recommendations` (New Module)

- [ ] **List Page:** View templates filtered by category/target.
- [ ] **Create Dialog:** Form to author a new recommendation.
    - **Integration:** Include "Search Evidence" picker to attach citations (reuse `retrieveContext`).

## 3. Intervention Plan UI (Student Profile)
**Path:** `src/app/dashboard/students/[id]/page.tsx` (Update)

- [ ] Add **"Interventions"** tab.
- [ ] **List View:** Active vs Completed plans.
- [ ] **Detail View (`/interventions/[planId]`):**
    - Track progress of each recommendation.
    - Add progress notes.

## 4. AI Generator (Assessment Integration)
**Path:** `src/app/dashboard/assessments/results/[id]/page.tsx`

- [ ] **Button:** "Generate Recommendations" (below citations).
- [ ] **Logic:**
    - Mock AI call analyzing Assessment Result.
    - Retrieve matching `RecommendationTemplates` (keyword match).
    - Display list of suggestions with "Add to Plan" checkboxes.
    - **Action:** Create new `InterventionPlan` for student.

## 5. Report Integration
**Path:** `src/app/dashboard/reports/builder/page.tsx` (New)

- [ ] Simple UI to compile:
    - Assessment Summary.
    - Evidence Citations (formatted via `citationFormat.ts`).
    - Recommended Interventions.
- [ ] Preview & Print (Browser Print).

## 6. Execution Steps
1.  **Schema**: Add Recommendation types.
2.  **Library UI**: Build Recommendation Library.
3.  **Student UI**: Add Interventions tab to Profile.
4.  **Generator**: Integrate into Assessment Results.
5.  **Report**: Build simple Report Builder.

## Manual Test Checklist
- [ ] **Create Template**: Go to Recommendation Library. Create "Reading Intervention". Attach an Evidence citation.
- [ ] **Generate**: Go to Assessment Result. Click "Generate Recommendations". Select the template. Save.
- [ ] **Track**: Go to Student Profile > Interventions. Open the plan. Mark an item as "In Progress".
- [ ] **Report**: Go to Report Builder (or button). Verify citations appear in the footer.
