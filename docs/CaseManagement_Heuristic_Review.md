# Case Management Heuristic Review & UX Audit

## 1. Top EPP Case Tasks
The Case Management system must support the structured lifecycle of clinical work.
*   **Task A: "Morning Triage" (10 min)**
    *   *Goal:* Review new automated cases (from Alerts), assign priority, and accept/reject them.
    *   *Ideal Flow:* Dashboard -> Filter "New/Triaging" -> Quick Preview -> [Accept & Assign] or [Dismiss as False Positive].
*   **Task B: "Deep Work" (30 min)**
    *   *Goal:* Manage a specific complex case (e.g., Statutory Assessment).
    *   *Ideal Flow:* Case Detail -> Review Timeline -> Check off "Observation" task -> Add "Parent Meeting" note -> Upload Report.
*   **Task C: "Escalation & Handoff" (5 min)**
    *   *Goal:* Transfer a high-risk case to a senior EPP or external agency.
    *   *Ideal Flow:* Case Detail -> "Transfer" -> Select User -> Add Handoff Note -> [Send].

## 2. Heuristic Evaluation (Nielsen Norms)

| Issue | Heuristic | Severity | Proposed Fix |
| :--- | :--- | :--- | :--- |
| **Alerts don't link to Cases clearly** | Visibility of System Status | **Critical** | When an Alert creates a Case, the Alert should visually transform into a "Case Card" or link explicitly. Current "Create Case" modal is disconnected. |
| **"Triage" state is missing** | Match between System & World | **High** | Cases currently default to "Open". Introduce a "Triage" state for auto-generated cases requiring human confirmation. |
| **No "Undo" for Case Creation** | User Control & Freedom | **Medium** | Add a "Case Created" toast with an "Undo" action to delete accidental cases immediately. |
| **Hidden Audit Trail** | Recognition rather than Recall | **High** | The "Timeline" is currently a tab. Important status changes (e.g., Risk Escalation) should be visible on the main case summary card. |
| **Safeguarding Flags subtle** | Error Prevention | **Critical** | "Critical" priority cases should have a distinct, non-dismissible red border/banner in the list view. |
| **Task Lists are rigid** | Flexibility & Efficiency | **Medium** | Allow ad-hoc tasks. Current lists feel like rigid templates (if any). EPPs need to add "Call Mom" quickly. |

## 3. Recommended UX Improvements

### A. The "Triage" Inbox
*   A dedicated view for `status='triage'`.
*   **Micro-copy:** "Guardian AI detected a potential risk. Please review."
*   **Actions:** [Confirm Case], [Merge with Existing], [Dismiss].

### B. Case Detail Layout (Two-Column)
*   **Left (Context):** Student Snapshot (Mini-360), Key Contacts, Safeguarding Status.
*   **Right (Workflow):**
    *   **Timeline Stream:** Combined audit log + user notes.
    *   **Active Tasks:** Checkbox list with due dates.
    *   **Evidence Pinboard:** Drag-and-drop area for key docs.

### C. Safeguarding UX
*   **Escalation Protocol:** If a user sets priority to "Critical", prompt: "Does this require immediate safeguarding referral? [View Protocol]".
*   **Consent Check:** Explicit warning if creating a case for a student with "Consent Revoked".

## 4. Accessibility Checklist (Case Flows)
*   [ ] **Keyboard Nav:** "Kanban" board (if used) must be navigable via Arrow Keys.
*   [ ] **Focus Management:** When closing the "Create Case" modal, focus returns to the triggering button.
*   [ ] **Color Contrast:** "Critical" red badges must pass WCAG AA on light/dark mode.
*   [ ] **ARIA Labels:** Timeline events need `aria-label="Status changed to Active by Dr. Smith"`.
*   [ ] **Screen Readers:** "New Case" alerts must use `role="alert"` or `aria-live="polite"`.

## 5. Priority List

### P0 (Must Fix)
- [ ] Implement "Triage" status and Inbox view.
- [ ] Safeguarding "Critical" UI distinction (Red Banner/Border).
- [ ] "Create Case" modal pre-fill from Alert context.

### P1 (High Value)
- [ ] Timeline visualization (audit log).
- [ ] Ad-hoc Task creation.

### P2 (Usability)
- [ ] Case "Merge" functionality.
- [ ] Drag-and-drop Kanban view.

Stage 2 complete. Ready for Stage 3 prompt.
