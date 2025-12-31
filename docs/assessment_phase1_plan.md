# Assessment Module Phase 1 Upgrade Plan

## Objective
Upgrade the MindKindler Assessment module to a fully functional, end-to-end system for Educational Psychologists (EPPs), supporting self-administered and clinician-administered modes, robust scoring (quant + qual), and profile integration.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **AssessmentTemplate:** Add `targetType` (Student, Parent, Teacher, School), `category` (expanded list).
- [ ] **Question:** Add `scoringRules` (weights), `helpText`.
- [ ] **AssessmentResult:** Add `status` (completed, reviewed), `aiSummary` (draft, approved), `overallScore`, `maxScore`.
- [ ] **AssessmentPrivateNote:** New interface for EPP notes per question.
- [ ] **AssessmentAssignment:** Ensure `dueDate`, `notes` to participant are present.

## 2. Assessment Builder (Templates)
**Path:** `src/app/dashboard/assessments/builder`

- [ ] **UI Refinement:** Ensure builder supports all Phase 1 question types:
    - Multiple Choice (Single/Multi)
    - Likert Scale (1-5)
    - Yes/No
    - Open Text
- [ ] **Scoring Config:** Add UI to set points/weights for options in the builder.
- [ ] **Metadata:** Add fields for Target Audience and Category.

## 3. Assessment Assignment & Runner
**Path:** `src/app/dashboard/assessments/page.tsx` (Assignment)
**Path:** `src/app/portal/assessment/[id]/page.tsx` (Runner)

- [ ] **Assignment UI:** Add "Assign to" modal with Due Date and Notes.
- [ ] **Runner UI:**
    - Support "Save Draft" (if possible in Phase 1, otherwise focus on Submit).
    - Handle all question types correctly.
    - Mobile-responsive layout.

## 4. Scoring Engine & Review Interface (The "grading" view)
**Path:** `src/app/dashboard/assessments/results/[id]/page.tsx` (New)

- [ ] **View Responses:** Display user answers.
- [ ] **Quantitative Scoring:** Auto-calculate scores for structured questions.
- [ ] **Qualitative Scoring (AI):**
    - specific UI for Open Text questions to "Generate AI Score".
    - Allow EPP override of score and comment.
- [ ] **Private Notes:**
    - UI to add/view private notes per question (stored in `assessmentPrivateNotes`).
- [ ] **AI Summary:**
    - Button to `generateAssessmentSummary()`.
    - Editable text area for EPP to approve.

## 5. Profile Integration
**Path:** `src/app/dashboard/students/[id]/page.tsx`

- [ ] **Assessment History:** Add tab/section to list completed assessments.
- [ ] **Summary View:** Show score/status of each. Link to the Review page.

## 6. AI Functions (Mock/Stub for Phase 1 if API not ready, or Genkit)
**Path:** `src/ai/flows/grading.ts` (New)

- [ ] `scoreOpenTextResponse`: Input (question, answer) -> Output (score, reasoning).
- [ ] `generateAssessmentSummary`: Input (all answers) -> Output (summary, risks).

## 7. Security & Rules
- [ ] Define Firestore rules strategy (conceptual implementation in code checks).

## Execution Order
1.  **Update Types:** `src/types/schema.ts`
2.  **AI Logic:** `src/ai/flows/grading.ts` (and `genkit` setup if needed).
3.  **Builder Upgrade:** `src/app/dashboard/assessments/builder/...`
4.  **Runner Upgrade:** `src/app/portal/assessment/[id]/page.tsx`
5.  **Review/Grading Page:** `src/app/dashboard/assessments/results/[id]/page.tsx`
6.  **Profile Updates:** `src/app/dashboard/students/[id]/page.tsx`
7.  **Final Polish:** Navigation, Toasts, Manual Test.
