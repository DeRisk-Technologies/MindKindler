# Student 360 Heuristic Review & UX Audit

## 1. Top EPP Tasks & Ideal Flows
The Student 360 profile is the cockpit for the Educational Psychologist.
*   **Task A: "Pre-Session Brief" (2 min)**
    *   *Goal:* Quickly grasp the student's current status, recent incidents, and active interventions before walking into a meeting.
    *   *Ideal Flow:* Open Profile -> See "At a Glance" (Risks, Consent, Recent AI Summary) -> Scan Timeline for last 3 events.
*   **Task B: "Field Note Entry" (30 sec)**
    *   *Goal:* Log a quick observation or behavior event while walking in a corridor or classroom (Mobile).
    *   *Ideal Flow:* Open Profile -> Hit "Quick Add" FAB -> Dictate/Type note -> Save (Optimistic Offline).
*   **Task C: "Intervention Review" (5 min)**
    *   *Goal:* Assess if the current support plan is working based on quantitative data.
    *   *Ideal Flow:* Tabs -> Interventions -> View Sparkline/Graph of progress -> Adjust Plan Status.

## 2. Heuristic Evaluation (Nielsen Norms)

| Issue | Heuristic | Severity | Proposed Fix |
| :--- | :--- | :--- | :--- |
| **"Loading..." Spinner on full profile** | Visibility of System Status | **High** | Use Skeleton loaders for widgets. Show "Cached" badge immediately if offline data exists. |
| **Consent Status hidden in tab** | Error Prevention | **Critical** | Move Consent Status (Green/Red Badge) to the sticky header next to the Student Name. |
| **"Case" vs "Consultation" confusion** | Consistency & Standards | **Medium** | Rename "Consultations" to "Sessions" or nest them clearly under "Cases" in the UI hierarchy. |
| **No "Undo" for Quick Notes** | User Control & Freedom | **Medium** | Add "Undo" toast after saving a quick observation note. |
| **Hidden Assessment Results** | Recognition rather than Recall | **High** | Surface the *latest* assessment score in the header/summary card, don't bury it in a table. |
| **Save button disabled while offline** | Match between System & World | **Critical** | Enable "Save (Queued)" button. EPPs expect to write notes anywhere (schools often have bad Wi-Fi). |

## 3. Mobile-First & Low-Bandwidth Strategy
*   **Prioritized Loading (The "First Paint"):**
    1.  **Identity Header:** Name, Age, Photo, **Consent Status**, **Safeguarding Flags**.
    2.  **Action Bar:** "Log Note", "Start Session", "Upload".
    3.  **AI Summary:** Text-only summary of last 30 days (low bytes).
*   **Deferred Loading (Lazy Load):**
    *   Historical Timeline (> 3 months ago).
    *   PDF Attachments (Assessments).
    *   Heavy Charts/Analytics.
*   **Interactions:**
    *   Touch targets > 44px for "Quick Add" buttons.
    *   Swipe actions on Timeline items (e.g., Swipe Right to "Flag for Review").

## 4. Safety & Governance UX
*   **Consent Visibility:**
    *   *Current:* Hidden in "Consent" tab.
    *   *Fix:* Persistent Banner if Consent is Revoked or Expiring soon. "WARNING: Data processing consent revoked."
*   **Safeguarding Flags:**
    *   If `student.needs` includes "Self-Harm" or "Abuse", display a distinct icon (Shield/Alert) in the header.
    *   Include a "Break Glass" button to view redacted info in emergencies, logging the action to `audit_logs`.

## 5. Recommended UX Patterns
*   **The "Huddle" Card:** A widget showing key contacts (Parent, Class Teacher, SENCO) with one-tap "Message" buttons.
*   **Timeline Stream:** A vertical feed combining Cases, Sessions, and Interventions chronologically. Uses icons to distinguish types.
*   **Evidence Pinboard:** A dedicated area for pinned "Key Evidence" (e.g., a critical diagnosis report) so it doesn't get lost in the timeline.

## 6. Implementation Priorities

### P0 (Must Fix / Safety)
- [ ] Move Consent Status to sticky header (Persistent).
- [ ] Implement "Offline Save" queue for text notes.
- [ ] Add Safeguarding Icons to Header.

### P1 (High Value / Efficiency)
- [ ] "Quick Actions" Floating Action Button (Mobile).
- [ ] AI Summary Widget (Top of profile).
- [ ] Skeleton Loaders to replace full-page spinner.

### P2 (Usability)
- [ ] Consolidate "Sessions" and "Cases" into a unified Timeline view.
- [ ] Add "Key Contacts" widget.

### P3 (Delight)
- [ ] Assessment Score Sparklines (Trends).
- [ ] Drag-and-drop widget reordering.

Stage 2 complete. Ready for Stage 3 prompt.
