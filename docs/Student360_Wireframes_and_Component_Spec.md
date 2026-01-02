# Student 360 Wireframes & Component Spec

## 1. Core Layout Structure (`Student360Layout`)

### Mobile View (Column)
```text
+-----------------------+
| [<] Name & Status [!] | (Sticky Header)
|-----------------------|
| [ Quick Actions FAB ] | (Floating)
|-----------------------|
| [  AI Summary Card  ] | (Collapsible)
|-----------------------|
| [   Action Items    ] | (Red/Orange cards)
|-----------------------|
| [ TABS: Timeline... ] |
|  - Case 123 (Open)    |
|  - Assessment (Done)  |
|-----------------------|
```

### Desktop View (Grid)
```text
+-----------------------+-----------------------+
| Header: Name, Age, SEN Status, [Safeguarding] |
+-----------------------+-----------------------+
| Left Col (Context)    | Right Col (Workflow)  |
|                       |                       |
| [ Identity Card     ] | [ Quick Actions Bar ] |
| [ Key Contacts      ] |                       |
| [ Active Plans      ] | [ Action Items      ] |
| [ AI Summary        ] | [ Unified Timeline  ] |
|                       |                       |
+-----------------------+-----------------------+
```

## 2. Component Specifications

### A. `StudentHeader`
*   **Location**: Sticky top bar.
*   **Props**: `student: Student`, `risks: Risk[]`, `consent: ConsentStatus`.
*   **UI Elements**:
    *   Name, Age (calculated), Photo.
    *   **Safeguarding Badge**: Red shield if `student.needs` includes high-risk tags.
    *   **Consent Indicator**: Green/Red dot with tooltip.
*   **Actions**: "Edit Profile" (Admin only).

### B. `ActionItemsWidget`
*   **Purpose**: Immediate "To-Do" list for this student.
*   **Data Source**: `cases` (status=open), `assessments` (status=pending), `interventions` (review_due).
*   **UI**:
    *   List of cards: `{Icon} {Title} {Due Date} {Action Button}`.
    *   Example: "Review IEP Goals" (Due Today) -> [Start Review].

### C. `UnifiedTimeline`
*   **Purpose**: Chronological stream of all student events.
*   **Props**: `events: TimelineEvent[]` (Union of Case, Session, Assessment, Intervention).
*   **UI**:
    *   Vertical line with icons.
    *   **Consultation**: Stethoscope icon, snippet of notes.
    *   **Assessment**: Clipboard icon, score summary.
    *   **Case**: Folder icon, status change.
*   **Interaction**: Click item -> Opens Detail Modal or navigates to page.

### D. `QuickActionsBar`
*   **Purpose**: One-tap access to common tasks.
*   **Items**:
    *   [Log Note] -> Opens text area modal.
    *   [Start Session] -> Navigates to `/consultations/new?studentId=...`.
    *   [Upload] -> Trigger file picker.
    *   [Message Parent] -> Open chat modal.

### E. `EvidencePanel` (Desktop Only / Drawer on Mobile)
*   **Purpose**: RAG source viewer.
*   **Props**: `documents: Document[]`.
*   **UI**:
    *   List of files with "Trust Score" (if validated).
    *   Preview button for PDFs.

## 3. Layout & CSS Guidance

### Grid System
*   **Mobile (<768px)**: Single column `grid-cols-1`. Gap `4`.
*   **Tablet (768px - 1024px)**: `grid-cols-1` with sidebar hidden (drawer).
*   **Desktop (>1024px)**: `grid-cols-12`.
    *   Left Context: `col-span-4`.
    *   Right Workflow: `col-span-8`.

### Card Design
*   **Base**: `bg-card border rounded-lg shadow-sm`.
*   **Alert**: `border-l-4 border-l-red-500 bg-red-50/10`.
*   **Interactive**: `hover:shadow-md transition-all cursor-pointer`.

### Typography
*   **Headings**: `text-lg font-semibold tracking-tight`.
*   **Meta**: `text-xs text-muted-foreground`.
*   **Body**: `text-sm leading-relaxed`.

## 4. Component Map (Implementation Plan)

| Component | File Path | Status |
| :--- | :--- | :--- |
| `StudentHeader` | `src/components/dashboard/students/profile/header.tsx` | **Create** |
| `ActionItemsWidget` | `src/components/dashboard/students/widgets/action-items.tsx` | **Create** |
| `UnifiedTimeline` | `src/components/dashboard/students/widgets/timeline.tsx` | **Create** |
| `QuickActions` | `src/components/dashboard/students/widgets/quick-actions.tsx` | **Create** |
| `EvidenceList` | `src/components/dashboard/students/widgets/evidence-list.tsx` | **Create** |
| `StudentLayout` | `src/app/dashboard/students/[id]/page.tsx` | **Refactor** |

Stage 3 complete. Ready for Stage 4 prompt.
