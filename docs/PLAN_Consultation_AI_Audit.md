# Consultation & AI Flows Audit Plan

## 1. Executive Summary
This audit focuses on hardening the core AI workflows used in MindKindler's Consultation module. The primary goal is to transition from "prototype" logic to "production-grade" reliability. This involves strictly enforcing schema validation, injecting the recently built Localization/Glossary context, ensuring deterministic safety checks (Guardian), and standardizing how transcript data is chunked and processed.

### Goals
- **Safety & Compliance:** Enforce deterministic risk detection and PII handling.
- **Localization:** Inject `locale` and `glossary` into all AI prompts using the Phase 6A infrastructure.
- **Robustness:** Strict Zod schema validation for all AI Inputs/Outputs.
- **Provenance:** Ensure AI insights link back to specific transcript segments or notes.

### Non-Goals
- UI/UX redesigns (except where necessary to display provenance/safety warnings).
- Changing the underlying speech-to-text provider (React Speech Recognition remains).

---

## 2. Audit Phases (Stages 1-8)

### Stage 1: Standardization & Localization Injection
- **Objective:** Refactor `src/ai/flows/...` to use the `buildSystemPrompt` utility from Phase 6A.
- **Action:** Ensure `locale`, `languageLabel`, and `glossary` are passed from the client (`page.tsx`) down to the AI flows and injected into the system prompt. Standardize model parameters (temperature, safety settings) in `src/ai/genkit.ts`.

### Stage 2: Input/Output Schema Validation
- **Objective:** Eliminate "stringly-typed" AI responses.
- **Action:** Define strict Zod schemas for `ConsultationInsightsInput` and `ConsultationReportOutput`. Update flows to reject invalid inputs and retry invalid JSON outputs.

### Stage 3: Transcript Chunking & Context Window Management
- **Objective:** Fix the naive chunking in `page.tsx` (`transcript.length - lastAnalyzedLength > 100`).
- **Action:** Implement a robust sliding window utility (`src/ai/utils/chunking.ts`) that respects sentence boundaries and overlaps context to prevent splitting insights across chunks.

### Stage 4: Deterministic Safety & Guardian Integration
- **Objective:** Ensure "Risk" detection is not solely reliant on LLM probability.
- **Action:** Integrate `src/ai/guardian/engine.ts` (from Governance Phase) into the Consultation flow. If a keyword (e.g., "harm", "suicide") appears in the transcript, force a high-priority "Risk" insight regardless of the LLM's output.

### Stage 5: Provenance & Citations
- **Objective:** AI assertions must cite evidence.
- **Action:** Update `generateConsultationInsights` to return `sourceIndex` or `quote` fields. Update UI to highlight the corresponding transcript text when an insight is clicked.

### Stage 6: Backend Parity & Cleanup
- **Objective:** Sync Cloud Functions with Genkit flows.
- **Action:** Review `functions/src/ai/...`. If redundant, mark for deprecation. If active, apply the same Schema/Glossary/Safety logic as the client-side flows to ensure consistency for background jobs.

### Stage 7: Testing Matrix Implementation
- **Objective:** Automated verification.
- **Action:** Implement unit tests for Prompt Builders and Chunking logic. Implement integration tests for Genkit flows using mock LLM responses.

### Stage 8: Final Review & Documentation
- **Objective:** Handover.
- **Action:** Update technical documentation, verify all acceptance criteria, and create a final "Audit Completion Report".

## 3. Configuration & Policy (Stage 5 Update)
- **Centralized Config:** `src/ai/config.ts` defines standard model parameters.
- **Risk/Diagnosis/Reports:** Must use `temperature: 0.0` for maximum determinism.
- **Creative Flows:** May use higher temperature (0.2 - 0.4).
- **Model:** Default is `gemini-1.5-flash` for speed/cost, with `gemini-pro` for complex reporting.

---

## 4. Source File Mapping

| Component | Files to Edit |
| :--- | :--- |
| **Client UI** | `src/app/dashboard/consultations/[id]/page.tsx` |
| **AI Utils** | `src/ai/utils/prompt-builder.ts`, `src/ai/dev.ts` |
| **Genkit Flows** | `src/ai/flows/generate-consultation-insights.ts`, `src/ai/flows/generate-consultation-report.ts`, `src/ai/genkit.ts` |
| **Cloud Functions** | `functions/src/ai/analyzeConsultationInsight.ts`, `functions/src/ai/generateClinicalReport.ts` |
| **New Files** | `src/ai/utils/chunking.ts`, `src/ai/utils/safety.ts` |

---

## 5. Acceptance Criteria

1.  **Locale Awareness:** If Tenant Locale is "fr-FR", AI prompts explicitly request French, and Glossary terms (e.g., "Student" -> "Élève") are respected in the output.
2.  **Schema Compliance:** AI flows throw strict errors if inputs are missing required fields; outputs always match the defined Zod schema.
3.  **Safety Intercept:** A deterministic list of "Red Flag" keywords triggers a `type: 'risk'` insight 100% of the time.
4.  **Provenance:** Every generated insight includes a reference (index or quote) to the input text.
5.  **Resilience:** Network failures or "hallucinated JSON" do not crash the React application.

---

## 6. Test Matrix

| Test Type | Scope | Scenario |
| :--- | :--- | :--- |
| **Unit** | `prompt-builder.ts` | Verify Glossary and Locale are appended correctly to system instructions. |
| **Unit** | `chunking.ts` | Verify sliding window overlaps correctly without cutting words. |
| **Integration** | `generateConsultationInsights` | Mock LLM input -> Verify Zod validation passes on output. |
| **Integration** | `Safety/Guardian` | Inject "harm" keyword -> Verify "Risk" insight is generated via deterministic path. |
| **Manual** | `LiveConsultationPage` | Speak into microphone -> Verify insights appear with correct Glossary terms. |

---

## 7. Rollout & Monitoring Checklist

- [ ] **Pre-Deploy:** Run `npm run test` (or specific test suite).
- [ ] **Deploy:** Deploy updated Security Rules and Cloud Functions.
- [ ] **Monitoring:**
    - Watch Firestore `ai_logs` (if implemented) for Schema Validation Failures.
    - Monitor Latency for `generateConsultationInsights` (ensure chunking doesn't introduce lag).
    - Check "Risk" flags in Dashboard for false positives.

Stage 0 complete. Ready for Stage 1 prompt.
