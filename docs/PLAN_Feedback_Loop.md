# Plan: Feedback Loop & AI Optimization

## 1. Objective
Transform MindKindler from a static AI tool into a learning system. By capturing explicit EPP feedback (thumbs up/down) and implicit signals (edits), we will tune the models to reduce repair rates and increase trust. Additionally, we will implement an "Assessment Recommender" to proactively suggest next steps during consultations.

## 2. Components

### A. Feedback Infrastructure
*   **Schema:** `ai_feedback` collection linked to `ai_provenance`.
*   **UI:** `FeedbackWidget` (Compact: Thumbs Up/Down + optional "Why?").
*   **Service:** `FeedbackService` with offline queuing (using `localforage`).

### B. Assessment Recommender
*   **Goal:** Suggest further testing based on clinical notes.
*   **Logic:**
    1.  Analyze Consultation Transcript/Notes.
    2.  Identify "Evidence Gaps" (e.g., "Cognitive data missing").
    3.  RAG Search against `assessment_templates` index.
    4.  Filter by "Available/Licensed" in Marketplace.
*   **Output:** List of recommended templates with reasoning.

### C. Metrics Dashboard
*   **View:** `/dashboard/admin/ai-metrics`
*   **KPIs:**
    *   **Acceptance Rate:** % of AI drafts used without major edits.
    *   **Repair Rate:** % of JSON repairs triggered.
    *   **Feedback Sentiment:** Ratio of Thumbs Up vs Down.

## 3. Implementation Steps

1.  **Schema:** Define `AiFeedback` and `AssessmentRecommendation` types.
2.  **Service:** Create `src/services/feedback-service.ts`.
3.  **UI:** Create `src/components/ai/FeedbackWidget.tsx`.
4.  **Backend:** Create `functions/src/ai/flows/recommendAssessments.ts`.
5.  **Integration:**
    *   Add Feedback to `ReportEditor`.
    *   Add Recommender to `Consultation` page.
6.  **Dashboard:** Build the Metrics page.

---
**Status:** Started.
