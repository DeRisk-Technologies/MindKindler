# Report Wireframes & Component Spec

## 1. Wireframes

### A) Report List (`/dashboard/students/[id]/reports`)
*Displays all reports associated with a student.*

**Desktop:**
*   **Header:** "Clinical Reports" | [ + New Report ] (Button)
*   **Table:**
    *   Columns: Title, Type (Consultation/Statutory), Status (Draft/Signed), Last Updated, Actions (Edit, PDF, View Versions).
    *   Row Actions: "Continue Draft" (primary if draft), "Download PDF" (secondary if signed).

**Mobile:**
*   **Card List:** Each card shows Title, Status Badge, Date.
*   **Tap:** Navigates to Editor (or Viewer if signed).

### B) Report Editor Screen (`/dashboard/reports/editor/[id]`)
*The main workspace. Split View Layout.*

**Desktop (Split View):**
*   **Top Bar:** Back Arrow | Report Title (Editable) | [Status Badge] | Auto-save Indicator | [Sign & Finalize] [Export]
*   **Left Pane (65% - Editor):**
    *   Rich Text Canvas (Tiptap) with formatting bubble menu.
    *   Sections separated by clear headers.
    *   "AI Draft" placeholders if empty.
*   **Right Pane (35% - Evidence Sidebar):**
    *   Tabs: "Evidence" | "AI Chat" | "History".
    *   **Evidence Tab:** Search bar. List of cards (Observations, Assessments). Drag handle on each card.
*   **Mobile:**
    *   Tabs at bottom: "Write" | "Evidence".
    *   "Evidence" opens as a drawer/sheet. User taps item to "Insert at Cursor".

### C) AI Draft Modal
*Triggered when creating a new report or clicking "Regenerate".*

*   **Title:** "Generate Clinical Draft"
*   **Template Select:** Dropdown (e.g., "Initial Consultation", "EHCP Review").
*   **Context Scope:** Checkboxes for "Include recent observations?", "Include assessment results?".
*   **Language:** Read-only label "English (UK)" (based on tenant).
*   **Primary Action:** [Generate Draft] (Shows loading state "Analyzing 12 documents...").

### D) Sign & Export Modal
*Triggered by "Sign & Finalize".*

*   **Warning:** "This locks the report. You cannot edit it after signing."
*   **Redaction Review:** "This report has 2 redacted sections. They will be hidden in the 'Parent' export."
*   **Signature:** "Digitally Signed by [Dr. Name] at [Timestamp]".
*   **Actions:** [Sign & Lock] | [Cancel].

---

## 2. Component Specifications

### 1. `ReportEditor` (Container)
*Manages state, auto-save, and layout.*

```typescript
interface ReportEditorProps {
  reportId: string;
  studentId: string;
  initialData: Report;
  readOnly?: boolean;
}

// State
const [content, setContent] = useState(initialData.content);
const [isSaving, setIsSaving] = useState(false);
const [sidebarOpen, setSidebarOpen] = useState(true);

// Actions
const handleAutoSave = useDebounce((newContent) => {
  // Write to reports/{id}
  // Update 'updatedAt'
}, 2000);

const handleFinalize = () => {
  // Open SignModal
};
```

### 2. `RichTextCanvas` (The Editor)
*Wrapper around Tiptap.*

```typescript
interface RichTextCanvasProps {
  content: string; // HTML or JSON
  onChange: (html: string) => void;
  onInsertCitation: (citation: Citation) => void;
  editable: boolean;
}

// Tiptap Extensions: 
// - StarterKit
// - Placeholder
// - CitationNode (Custom inline node for [Ref])
// - RedactionMark (Custom mark for highlighted redactions)
```

### 3. `EvidenceSidebar`
*Fetches and displays linkable data.*

```typescript
interface EvidenceSidebarProps {
  caseId: string;
  onInsert: (item: EvidenceItem) => void; // Emits event to parent
}

// Logic:
// 1. fetchCollection(`cases/${caseId}/evidence`)
// 2. Filter by type (observation, assessment)
// 3. Render <EvidenceCard> for each.

// Events:
// onDragStart -> Transfers data { id, label, type }
// onClick -> Calls onInsert()
```

### 4. `SignOffModal`
*Handles the transition from Draft to Final.*

```typescript
interface SignOffModalProps {
  open: boolean;
  onConfirm: () => Promise<void>;
  redactionCount: number;
}
```

---

## 3. Data Flow & Transitions

### Scenario: AI Draft Generation
1.  **User:** Clicks "Generate Draft" in Modal.
2.  **Frontend:** Calls `httpsCallable('generateClinicalReport')` with `{ template: 'standard', studentId: '...' }`.
3.  **Backend:**
    *   Fetches student data & glossary.
    *   Generates prompt.
    *   Calls Genkit.
    *   Writes `ai_provenance` log.
    *   Returns JSON `{ sections: [...] }`.
4.  **Frontend:** Receives JSON. Converts to HTML/Tiptap content. Populates Editor.
5.  **User:** Sees text appear. "Auto-save" triggers -> Writes to Firestore `reports/{id}`.

### Scenario: Signing & Locking
1.  **User:** Clicks "Sign & Finalize". Confirms in Modal.
2.  **Frontend:** Calls `updateDoc('reports/{id}')`:
    *   `status`: 'signed'
    *   `signedBy`: 'uid'
    *   `signedAt`: `serverTimestamp()`
    *   `version`: `increment(1)`
3.  **Frontend:** Creates snapshot in `reports/{id}/versions/{v1}`.
4.  **UI:** Redirects to "View Mode" (ReadOnly). Editor is disabled. Success toast appears.

---

## 4. Accessibility & I18n

*   **Editor:**
    *   Tiptap is generally accessible, but custom nodes (Citations) need `aria-label="Citation: Observation 1"`.
    *   Toolbar buttons need tooltips and aria-labels.
*   **Sidebar:**
    *   Draggable items must have keyboard alternative (Enter to insert).
*   **I18n:**
    *   All UI labels wrapped in `t()`.
    *   Date formats in Evidence Sidebar use `Intl.DateTimeFormat`.
    *   "Redacted" placeholder text must be localized.

---

## 5. File Map

Create the following component structure:

```text
src/
  components/
    dashboard/
      reports/
        editor/
          ReportEditor.tsx        // Main container
          RichTextCanvas.tsx      // Tiptap wrapper
          EditorToolbar.tsx       // Formatting buttons
          SectionControl.tsx      // AI regenerate button per section
        sidebar/
          EvidenceSidebar.tsx     // Right pane container
          EvidenceCard.tsx        // Individual item
          CitationSearch.tsx      // Filter input
        modals/
          AiDraftModal.tsx        // Template selection
          SignOffModal.tsx        // Finalize flow
          ExportModal.tsx         // PDF download options
```

---
Stage 3 complete. Ready for Stage 4 prompt.
