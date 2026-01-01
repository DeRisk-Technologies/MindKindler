# Case Management Code Inventory

## 1. Overview
The Case Management system is currently in its infancy, primarily supporting ad-hoc case creation from consultations and alerts. This inventory maps existing code, data models, and gaps to inform the upcoming robust implementation.

## 2. File Inventory

| File Path | Description |
| :--- | :--- |
| `src/services/case-service.ts` | Core service for creating cases (currently handles `createCaseFromAlert`). |
| `src/services/__tests__/case-service.spec.ts` | Unit tests for case creation service. |
| `src/components/student360/CreateCaseModal.tsx` | UI dialog for escalating alerts to cases. |
| `src/components/student360/AlertCard.tsx` | Card displaying alerts with a "Create Case" action. |
| `src/app/dashboard/cases/page.tsx` | Main case listing page (likely placeholder or basic list). |
| `src/app/dashboard/consultations/[id]/page.tsx` | Live consultation view with "Create Case File" action. |
| `src/types/schema.ts` | TypeScript definitions for `Case`, `Alert`, etc. |
| `functions/src/ai/analyzeConsultationInsight.ts` | AI function that can trigger deterministic case creation (risk detection). |

## 3. Data Model Audit

### Existing Collections
- **`cases`**: Top-level collection (likely needs migration to tenant-subcollection).
- **`alerts`**: (Mocked in service, likely `tenants/{t}/alerts` in production).

### Proposed Schema

#### Case Document (`tenants/{tenantId}/cases/{caseId}`)
```typescript
interface Case {
  id: string;
  type: 'student' | 'school';
  subjectId: string; // studentId
  title: string;
  description: string;
  status: 'triage' | 'active' | 'waiting' | 'closed';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sourceAlertId?: string;
  evidence: EvidenceItem[];
  tags: string[];
}
```

#### Sub-collections
- **`tasks`**: Action items for the case.
  ```typescript
  interface CaseTask {
    title: string;
    status: 'pending' | 'done';
    dueAt?: Timestamp;
    assignedTo?: string;
  }
  ```
- **`timeline`**: Audit log of events.
  ```typescript
  interface TimelineEvent {
    type: 'status_change' | 'note' | 'alert_linked';
    content: string;
    actorId: string;
    timestamp: Timestamp;
  }
  ```

### Migration Notes
- Current `cases` are created in root `cases` collection by `createCaseFromAlert`.
- **Migration:** Move all docs from root `cases` to `tenants/{default}/cases`. Update `case-service` to write to tenant path.

## 4. Security & Rules Check

### Current Risks
- `case-service.ts` writes to root `cases` collection. Rules likely allow authenticated writes but may lack tenant isolation.
- No explicit "Assignment" check for reading cases (anyone in tenant can read?).

### Required Rule Changes
- **Write:** Allow `create` if `request.auth.token.tenantId == resource.data.tenantId`.
- **Update:** Allow if `resource.data.assignedTo == request.auth.uid` OR user is Admin.
- **Read:** Allow if `request.auth.token.tenantId == resource.data.tenantId` (Standard multi-tenant).

Stage 1 complete. Ready for Stage 2 prompt.
