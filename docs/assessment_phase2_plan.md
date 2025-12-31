# Assessment Module Phase 2 Implementation Plan

## Objective
Extend the existing Phase 1 Assessment system with "Live Mode" for clinicians, voice input, basic branching logic, and improved AI scoring feedback. This phase focuses on enhancing the EPP's workflow and data richness without altering the core Phase 1 data structure destructively.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **Question:** Add `conditions` field for branching logic.
    ```typescript
    conditions?: {
      questionId: string;
      operator: 'equals' | 'not_equals';
      value: string | number | boolean;
    }[];
    ```
- [ ] **AssessmentAssignment:** Add `mode` field (`self` | `clinician-live`).
- [ ] **AssessmentResult:** Add `mode` field.
- [ ] **AssessmentResult (Response):** Add `aiConfidence` and `aiHighlights`.

## 2. Feature Implementation

### A. Clinician "Live Mode"
**Files:**
- `src/app/dashboard/assessments/page.tsx` (Add "Start Live" action)
- `src/app/portal/assessment/[id]/page.tsx` (Update Runner)

**Requirements:**
- Pass a `mode` query param or detect from Assignment.
- If `mode === 'clinician-live'`, enable specific UI overrides:
    - Larger typography.
    - Simplified navigation (Hide unrelated chrome if possible).
    - Auto-save on every answer change (debounce).

### B. Voice Input
**Files:**
- `src/app/portal/assessment/[id]/page.tsx`
- New Component: `src/components/ui/voice-input.tsx`

**Requirements:**
- Add microphone icon to `essay` and `short-answer` inputs.
- Use `window.webkitSpeechRecognition` or standard Web Speech API.
- Append text to current input value.

### C. Basic Branching Logic
**Files:**
- `src/app/dashboard/assessments/builder/page.tsx` (Builder)
- `src/app/portal/assessment/[id]/page.tsx` (Runner)

**Requirements:**
- **Builder:** Add UI in the Question card to "Add Condition".
    - Select from previous questions.
    - Set expected value.
- **Runner:**
    - Filter the `questions` array based on current `responses` state.
    - If a question is hidden, ensure it doesn't block "Next" if required.

### D. Improved AI Scoring
**Files:**
- `src/ai/flows/grading.ts`
- `src/app/dashboard/assessments/results/[id]/page.tsx` (Review UI)

**Requirements:**
- Update `scoreOpenTextResponse` to return `confidence` and `highlights`.
- Update Review UI to show confidence badge (Green/Yellow/Red).

### E. Assessment Comparison
**Files:**
- `src/app/dashboard/students/[id]/page.tsx`

**Requirements:**
- Add "Compare" button in Assessment History tab.
- Modal or specific view to select 2 assessments.
- Side-by-side score comparison.

### F. Phase 3 Prep
- Create `src/app/dashboard/intelligence/page.tsx` (Placeholder).
- Create `src/ai/knowledge/index.ts` (Empty).

## 3. Execution Order
1.  **Schema Updates**: `src/types/schema.ts`
2.  **AI Logic**: `src/ai/flows/grading.ts`
3.  **Voice Component**: `src/components/ui/voice-input.tsx`
4.  **Builder Update**: Add Branching Logic UI.
5.  **Runner Update**: Add Logic handling + Voice Input + Live Mode styles.
6.  **Dashboard Update**: Add "Start Live" buttons.
7.  **Review Page Update**: Show improved AI data.
8.  **Profile Update**: Comparison view.
9.  **Phase 3 Prep**.

## 4. Testing
- [ ] Create a template with a condition (Show Q2 if Q1=Yes).
- [ ] Run in Live Mode.
- [ ] Use Voice Input on Q3.
- [ ] Submit and Check AI Grading confidence.
- [ ] Compare with a previous result.
