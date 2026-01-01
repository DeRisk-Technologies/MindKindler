# Report Writing Experience: Heuristic UX Review

## 1. Executive Summary
The Report Writing module is a critical "System of Record" tool for Educational Psychologists (EPPs). It bridges the gap between raw clinical data and formal, legally binding documentation. The current implementation (basic text areas) is insufficient for professional use. The new design must prioritize **accuracy** (citations), **safety** (redaction/consent), and **efficiency** (AI drafting).

**Core Persona:** Dr. Sarah, a Senior EPP. She is time-poor, manages 40+ active cases, works offline in schools, and dreads "admin evenings". She needs a tool that feels like a trusted co-pilot, not a generic text generator.

---

## 2. Key User Tasks & Workflows

### Task A: "Blank Page" to First Draft
*User Goal:* Quickly generate a structured report foundation without typing boilerplate.
*Current State:* No evident "Start with AI" flow in the editor, only ad-hoc generation.
*Target State:* A clear "Generate Draft" action that prompts for template selection (e.g., "Standard Consultation", "EHCP Statutory") and scope (e.g., "Include last 3 observations").

### Task B: Verifying Claims (Evidence Citation)
*User Goal:* Ensure the statement "The student struggles with transitions" is backed by data.
*Current State:* Manual copy-paste from other tabs. High cognitive load.
*Target State:* A persistent "Evidence Sidebar". Dragging an observation card into the text inserts a citation `[Obs-12]` and links the source metadata.

### Task C: Redacting for Parents
*User Goal:* Share the report with parents but hide sensitive internal notes or unverified third-party claims.
*Current State:* None. Users likely maintain two separate Word docs (high risk of error).
*Target State:* "Redaction Mode" toggle. highlighting text marks it as `restricted`. Export dialog offers "Clinician Copy" (Full) vs "Parent Copy" (Redacted).

### Task D: Final Sign-off
*User Goal:* Lock the report to prevent accidental edits and timestamp it for compliance.
*Current State:* "Save" button updates the doc but doesn't lock it or version it.
*Target State:* "Finalize & Sign" workflow. Requires re-authentication or explicit confirmation. Freezes the artifact and increments version.

---

## 3. Heuristic Evaluation (Nielsen’s 10 + Safety)

### 1. Visibility of System Status
*   **Issue:** AI generation is a "black box". Long spinners (10s+) cause abandonment.
*   **Fix:** Use "Streaming UI" or "Progress Steps" (e.g., "Analyzing Notes...", "Drafting Summary...", "Applying Glossary...").
*   **Severity:** P1

### 2. Match Between System and Real World
*   **Issue:** Terminology mismatch. "AI Rewrite" is generic.
*   **Fix:** Use domain language. Instead of "Regenerate", use **"Rephrase for Clinical Tone"** or **"Simplify for Parents"**.
*   **Severity:** P2

### 3. User Control and Freedom
*   **Issue:** If AI hallucinations occur, deleting them is easy, but *correcting* the underlying logic is hard.
*   **Fix:** "Undo" support in the editor (Ctrl+Z). "Reject Draft" option that clears the section and asks for feedback.
*   **Severity:** P0

### 4. Error Prevention (Safety & Compliance)
*   **Issue:** Risk of exporting sensitive data to parents.
*   **Fix:** **P0 Requirement.** Pre-export warning: *"This report contains 3 unredacted internal notes. Are you sure you want to export the PARENT version?"*
*   **Severity:** P0

### 5. Recognition Rather Than Recall
*   **Issue:** Remembering specific observation dates or scores.
*   **Fix:** The Evidence Sidebar must show *dates* and *summaries*, not just "Observation 1".
*   **Severity:** P1

### 6. Aesthetic and Minimalist Design
*   **Issue:** Editor can get cluttered with formatting toolbars.
*   **Fix:** Contextual bubble menu (like Notion/Medium) for formatting. Keep the writing surface clean.
*   **Severity:** P3

---

## 4. Safety & Provenance Heuristics

*   **Provenance Indicator:** Every AI-generated section must have a subtle indicator (e.g., a sparkle icon or colored left-border) until the human edits it. Once edited, the indicator fades or changes to "Human Verified".
*   **Confidence Scores:** If AI confidence is low (<70%) on a specific claim, highlight it in yellow for review.
*   **Redaction Visibility:** Redacted text should appear as black bars or blurred text in the "Preview" mode, but highlighted (e.g., pink background) in "Edit" mode.

---

## 5. Prioritized Fixes (P0 - P3)

### P0: Must-Have for Launch (Safety & Core Utility)
1.  **Draft Generation Hook:** Connect Editor "Generate" button to `generateClinicalReport` Cloud Function.
2.  **Rich Text Editor:** Replace `Textarea` with Tiptap (Headless) to support bold, lists, and citation tags.
3.  **Finalize Workflow:** "Finalize" button must set status to `signed`, lock editing, and create a `version` snapshot.
4.  **Redaction UI:** Ability to mark text ranges as `redacted`.
5.  **Export Safety Check:** Warning dialog before download if redactions exist.

### P1: High Priority (Usability)
1.  **Evidence Sidebar (Read-Only):** Display list of Case Evidence next to editor.
2.  **Streaming/Loading States:** "Skeleton" loading for draft generation to improve perceived performance.
3.  **Glossary Enforcement:** Ensure `glossarySafeApply` is running and visually confirm term swaps (e.g., tooltip: "Replaced 'Student' with 'Learner'").

### P2: Medium Priority (Delighters)
1.  **Citation Insertion:** Clicking evidence in sidebar inserts `[Ref]` in text.
2.  **AI Rephrase:** "Make this section shorter" or "Make this friendlier".
3.  **Auto-Save:** Robust auto-save every 30s.

### P3: Low Priority (Future)
1.  **Voice Dictation:** Direct dictation into the editor.
2.  **Diff View:** Visual comparison between Version 1 and Version 2.

---

## 6. Accessibility & Localization

*   **Screen Readers:** The Rich Text Editor must be ARIA-compliant. Redacted text must be announced as "Redacted content" to screen readers in the parent view.
*   **Keyboard Nav:** Users must be able to Tab between the Editor and the Evidence Sidebar.
*   **Localization (Phase 6A-1):**
    *   Editor interface (buttons, labels) must use `t('reports.save')`.
    *   Date formats in the evidence sidebar must respect the EPP's locale (DD/MM/YYYY vs MM/DD/YYYY).

---

## 7. Microcopy Suggestions

| Context | Bad / Generic | Good / Clinical |
| :--- | :--- | :--- |
| **Empty State** | "No report yet." | "Ready to draft. Select a template to begin." |
| **AI Action** | "Generate" | "Draft Clinical Narrative" |
| **Redaction** | "Hide this" | "Mark for Redaction (Parent Safe)" |
| **Export** | "Download" | "Export Secure PDF" |
| **Evidence** | "Data" | "Supporting Evidence" |
| **Finalize** | "Finish" | "Sign & Finalize Report" |

---
Stage 2 complete. Ready for Stage 3 prompt.
