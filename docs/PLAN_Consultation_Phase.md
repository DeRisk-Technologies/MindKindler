# Plan: Consultation & Live AI Phase

## Status: Active
**Focus:** Live Clinical Sessions, AI Co-Pilot (Gemini 2.0), and Statutory Compliance.

## 1. Completed Items
- **Schema Architecture:**
    - Updated `ConsultationSession` to support 'Clinical Modes'.
    - Added `ConsultationEvent` for timeline tracking.
- **Marketplace & Country OS:**
    - Defined `ConsultationTemplate` & Updated `uk_la_pack.json` (Person-Centered, Complex, etc.).
- **Live Consultation (Frontend):**
    - `src/app/session/student/[id]/page.tsx`: Student Bridge UI (AAC, Captions).
    - `src/app/dashboard/consultations/live/[id]/page.tsx`: EPP Cockpit (Split-pane, Transcript, Observation).
- **Live Consultation (Backend):**
    - `src/services/ai/ConsultationCopilot.ts`: Streaming AI Service using Gemini 2.0 Flash and buffered JSON parsing.
- **Post-Session Synthesis (Frontend):**
    - `src/components/consultations/PostSessionSynthesis.tsx`: Initial UI for Review, Plan, and Q&A.
    - **Confirmed:** Human-in-the-loop opinion confirmation.

## 2. Current Sprint: Production-Grade Treatment Planning
- **Objective:** Convert the mocked "AI Suggest" button in the Synthesis UI into a real, intelligent intervention planner.
- **Action 1: Implement `SmartInterventionMapper` Logic**
    - Create/Update `src/services/ai/InterventionPlanner.ts`.
    - Logic:
        1.  Analyze `Transcript` (Session Evidence).
        2.  Analyze `AssessmentScores` (e.g., WISC-V Low VCI).
        3.  Load `TenantSettings` (Marketplace Packs: `uk_la_pack` interventions).
        4.  **Prompt AI:** "Map these deficits to the available intervention library. Rank by efficacy."
- **Action 2: Integrate into Frontend**
    - Update `src/components/consultations/PostSessionSynthesis.tsx` to call the real service.
    - Remove the `setTimeout` mock.

## 3. Upcoming Tasks (Queue)
- **Report Builder Integration:**
    - Connect the `PostSessionSynthesis` output to the `ReportEditor` (Phase 8).
    - Ensure citations from the session are passed as `ProvenanceMetadata`.

## 4. Technical Debt & Constraints
- **Data Sovereignty:** Ensure the synthesis data (Treatment Plan, Referrals) is saved to the Regional DB.
- **AI Safety:** Explicit "Human-in-the-loop" validation step in the Synthesis UI before confirming hypotheses.
