# Case Management Phase Plan

## 1. Objective
Design and implement a robust **Case Management System** tailored for Educational Psychologists (EPPs). This system serves as the operational backend for the "Student 360" view, handling the lifecycle of interventions, risk escalations, and statutory assessments.

### Goals
- **Centralized Workflow:** A single place to manage student-level and school-level cases.
- **Automation:** Auto-create cases from critical alerts (e.g., safeguarding risks) with immediate triage status.
- **Accountability:** Built-in SLA tracking, task checklists, and audit trails for every action.
- **Integration:** Deep links with `Student360`, `Consultation` sessions, and `Assessments`.
- **Offline-First:** Full capability to read/update cases in low-bandwidth field settings.

### Non-Goals
- replacing external legal case management systems (e.g., court document handling) – we focus on the *clinical/educational* workflow.
- Real-time chat (use existing messaging module).

---

## 2. Execution Phases

### Phase 1: Inventory & Data Model
- **Goal:** Define the schema and audit existing "Case" references.
- **Tasks:** Audit `src/services/case-service.ts` and `functions/src/ai/analyzeConsultationInsight.ts`. Finalize Firestore schema for `Cases`, `CaseTimeline`, and `Tasks`.

### Phase 2: Heuristic UX Review
- **Goal:** Ensure flows match EPP mental models.
- **Tasks:** Map workflows for "Triage", "Statutory Assessment", and "Safeguarding Escalation". Identify gaps in current `cases/page.tsx`.

### Phase 3: Wireframes & Component Spec
- **Goal:** Design the UI.
- **Tasks:** Design "Kanban" vs "List" views, Case Detail layout (Timeline + Sidebar), and "Add Task" interactions. Define components (`CaseCard`, `TimelineStream`, `SlaBadge`).

### Phase 4: Core Implementation (Backend)
- **Goal:** Robust service layer.
- **Tasks:** Extend `case-service.ts` with sub-collection support (`tasks`, `timeline`). Implement `functions` for SLA monitoring (scheduled triggers).

### Phase 5: UI Implementation
- **Goal:** Build the frontend.
- **Tasks:** Refactor `/dashboard/cases` to support filtering/sorting. Build `/dashboard/cases/[id]` with tabs for Overview, Timeline, and Tasks. Integrate `CreateCaseModal` (from Student360) globally.

### Phase 6: Automation & SLA Rules
- **Goal:** Reduce administrative burden.
- **Tasks:** Refine `analyzeConsultationInsight.ts` to link provenance directly to new cases. Implement "Stale Case" alerts if no activity > 30 days.

### Phase 7: Offline/Sync & Monitoring
- **Goal:** Field readiness.
- **Tasks:** Add `cases` to `localforage` cache strategy. Add telemetry for "Time to Triage" and "Case Closure Rate".

### Phase 8: Tests, QA & Release
- **Goal:** Stability.
- **Tasks:** Unit tests for SLA logic. E2E tests for Alert -> Case -> Close flow. Feature flag rollout.

---

## 3. Proposed Firestore Data Model

### Collection: `tenants/{tenantId}/cases`
```typescript
interface Case {
  id: string;
  type: 'student' | 'school' | 'staff';
  subjectId: string; // studentId or schoolId
  title: string;
  description: string;
  status: 'triage' | 'active' | 'waiting' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo: string; // userId
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Automation & SLA
  sourceAlertId?: string; // Link to origin alert
  slaDueAt?: Timestamp;   // Calculated deadline
  tags: string[];         // e.g. ["safeguarding", "statutory"]
  
  // Evidence Snapshot (Lightweight)
  evidenceSummary?: {
    count: number;
    lastAdded: Timestamp;
  };
}
```

### Sub-collection: `.../cases/{caseId}/timeline`
Immutable audit log of events.
```typescript
interface TimelineEvent {
  id: string;
  type: 'status_change' | 'note' | 'document' | 'alert_linked' | 'task_completed';
  content: string; // Human readable summary
  metadata?: Record<string, any>; // e.g. { oldStatus: 'active', newStatus: 'closed' }
  actorId: string;
  timestamp: Timestamp;
}
```

### Sub-collection: `.../cases/{caseId}/tasks`
Actionable items.
```typescript
interface CaseTask {
  id: string;
  title: string;
  status: 'pending' | 'done';
  dueAt?: Timestamp;
  assignedTo?: string;
}
```

---

## 4. Security & Governance

### Roles & Permissions
- **Tenant Admin:** Full Create/Read/Update/Delete (CRUD) on all cases.
- **EPP / Clinical Psychologist:** Full CRUD on cases they own or are assigned to. Read access to all student cases (unless sealed).
- **Teacher:** Read-only on cases where they are explicitly added as a collaborator (to be implemented).
- **Student/Parent:** No direct access; data exposed only via specific Reports.

### Firestore Rules Strategy
- `allow read`: if `request.auth.token.tenantId == resource.data.tenantId`.
- `allow write`: if `hasRole('educationalpsychologist')` OR `resource.data.assignedTo == request.auth.uid`.
- **Audit:** All write operations must trigger a Cloud Function (or client-side batch) to write to `timeline` sub-collection for non-repudiation.

---

## 5. Acceptance Criteria & Test Matrix

### Criteria
1.  **Creation:** Can create a case manually OR from an Alert (inheriting evidence).
2.  **Triage:** Cases created by AI/Alerts default to `triage` status.
3.  **Timeline:** Changing status from `triage` -> `active` automatically adds a timeline entry.
4.  **Tasks:** Completing all tasks suggests (but does not force) closing the case.
5.  **Offline:** Creating a case while offline queues it; syncs automatically upon reconnection.

### Test Matrix
| Type | Test Case | Tooling |
| :--- | :--- | :--- |
| **Unit** | `case-service`: `createCase` correctly populates `slaDueAt` based on priority. | Jest |
| **Integration** | `analyzeConsultationInsight`: High-risk transcript triggers Case creation in Emulator. | Firebase Emulator |
| **UI E2E** | User can drag a case from "Triage" to "Active" in Kanban view. | Playwright/Cypress (future) or Manual |
| **Security** | Teacher cannot close a case assigned to an EPP. | Firestore Rules Unit Tests |

---

## 6. Rollout Plan

1.  **Migration:**
    - Scan existing `cases` collection (if any generic docs exist from Phase 1) and backfill `status='active'` and `timeline` init.
    - Existing `alerts` with `severity='critical'` that are unhandled should auto-generate draft cases.
2.  **Feature Flag:** `CASE_MANAGEMENT_V2` enabled for internal tenants first.
3.  **Monitoring:** Watch `ai_provenance` for `caseLinked` events to ensure AI escalation is working.

Stage 0 complete. Ready for Stage 1 prompt.
