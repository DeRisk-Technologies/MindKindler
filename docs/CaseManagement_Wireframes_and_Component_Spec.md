# Case Management Wireframes & Component Spec

## 1. Core Data Flows

### Alert to Case Escalation
1.  **Trigger:** EPP clicks "Create Case" on an AlertCard (Student360).
2.  **Modal:** `CreateCaseModal` opens, pre-filled with Alert title, description, and linked evidence IDs.
3.  **Action:** EPP adjusts priority (e.g., 'Critical'), assigns to self or colleague, and submits.
4.  **Service:** `caseService.createCase(input)` is called.
    *   Creates `cases/{caseId}` document.
    *   Creates initial `timeline` event: "Case created from Alert [ID]".
    *   Updates Alert status to `triaged` (mocked or real).
    *   Logs provenance to `ai_provenance`.
5.  **Feedback:** Toast confirms creation; redirect to `/dashboard/cases/[id]` optional but recommended.

## 2. Wireframes

### A. Case List (`/dashboard/cases`)
**Layout:** Full-width table with top filters.
```text
+-----------------------------------------------------------------------+
|  [ Filter: Status v ] [ Filter: Priority v ] [ Filter: Assigned To v ]|
|  [ Search...      ]                                   [ + New Case ]  |
+-----------------------------------------------------------------------+
|  ID     | Title               | Student      | Priority | Status | Due|
|-----------------------------------------------------------------------|
|  C-101  | Attendance Risk     | Leo M.       | [Critical]| Open   | 2d |
|  C-102  | Statutory Assessment| Sarah J.     | [High]    | Waiting| 5d |
+-----------------------------------------------------------------------+
```

### B. Case Detail (`/dashboard/cases/[id]`)
**Layout:** Two-column desktop (2/3 + 1/3). Mobile: Stacked tabs.
```text
+-----------------------------------+-----------------------------------+
|  < Back  Case C-101: Attendance   |  [Edit] [Close Case] [Escalate]   |
|  Status: [Open v] Priority: [High]|                                   |
+-----------------------------------+-----------------------------------+
|  LEFT COLUMN (Context & Work)     |  RIGHT COLUMN (Meta & Timeline)   |
|                                   |                                   |
|  [ Student Snapshot Card ]        |  [ Metadata Card ]                |
|   - Leo Martinez (8y)             |   - Assigned: Dr. Reed            |
|   - [View 360 Profile]            |   - SLA Due: Oct 24 (2 days)      |
|                                   |                                   |
|  [ TABS: Overview | Tasks ]       |  [ Timeline Stream ]              |
|                                   |   | (Today)                       |
|  (Overview Tab)                   |   o Status -> Open (Dr. Reed)     |
|  Description: ...                 |   |                               |
|                                   |   o Note added: "Called Mom..."   |
|  [ Evidence Pinboard ]            |   | (Yesterday)                   |
|   - [PDF] Attendance Log          |   o Alert Triggered (Guardian AI) |
|   - [Note] Teacher Report         |                                   |
|                                   |  [ Add Note Input... ] [Post]     |
|  (Tasks Tab)                      |                                   |
|   [ ] Call Parent (Due Tomorrow)  |                                   |
|   [x] Review Files                |                                   |
|   [ + Add Task ]                  |                                   |
+-----------------------------------+-----------------------------------+
```

## 3. Component Specifications

### A. `CaseListTable`
*   **Path:** `src/components/cases/CaseListTable.tsx`
*   **Props:** `cases: Case[]`, `isLoading: boolean`.
*   **Features:** Sortable columns, badge coloring for priority/status.
*   **A11y:** `aria-label="Case list"`, row headers.

### B. `CaseDetailLayout`
*   **Path:** `src/app/dashboard/cases/[id]/page.tsx`
*   **Structure:** Responsive grid container. Uses `Skeleton` for loading states.
*   **Data:** Fetches `case`, `student`, `timeline` in parallel.

### C. `CaseTimeline`
*   **Path:** `src/components/cases/CaseTimeline.tsx`
*   **Props:** `events: TimelineEvent[]`, `onAddNote: (text: string) => void`.
*   **UI:** Vertical list. Icons distinguish `system` events vs `user` notes.
*   **Write:** Adds doc to `cases/{id}/timeline`.

### D. `CaseTasks`
*   **Path:** `src/components/cases/CaseTasks.tsx`
*   **Props:** `tasks: CaseTask[]`, `onToggle: (id: string, status: boolean) => void`, `onAdd: (task: Partial<CaseTask>) => void`.
*   **UI:** Checkbox list. Inline "Add Task" row.

### E. `EscalationModal`
*   **Path:** `src/components/cases/EscalationModal.tsx`
*   **Props:** `isOpen`, `caseId`, `currentOwner`.
*   **Actions:** Select new owner (e.g., "Senior EPP"), add "Handover Note". Updates `assignedTo` and adds timeline event.

## 4. API / Service Signatures (`src/services/case-service.ts`)

```typescript
// Fetch all cases for tenant (with optional filters)
getCaseList(tenantId: string, filters?: CaseFilters): Promise<Case[]>;

// Fetch single case details
getCaseById(caseId: string): Promise<Case | null>;

// Create new case (already partially implemented)
createCase(input: CreateCaseInput): Promise<string>;

// Update status (e.g. 'open' -> 'closed')
updateCaseStatus(caseId: string, status: CaseStatus, userId: string): Promise<void>;

// Add a timeline event (system or user note)
addTimelineEvent(caseId: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<void>;

// Task management
addTask(caseId: string, task: Omit<CaseTask, 'id'>): Promise<void>;
toggleTaskStatus(caseId: string, taskId: string, isDone: boolean): Promise<void>;
```

## 5. CSS & Layout Guidance
*   **Breakpoints:**
    *   `md` (768px): Switch from Stacked to 2-Column layout.
    *   `lg` (1024px): Show "Evidence Pinboard" expanded.
*   **Card Styles:** Use `shadcn/ui` Card components with `border-l-4` for priority indication (Red=Critical, Orange=High, Blue=Medium).
*   **Mobile:** "Timeline" moves to a bottom sheet or a dedicated tab to save vertical space.

Stage 3 complete. Ready for Stage 4 prompt.
