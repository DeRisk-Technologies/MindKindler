# Plan: EPP Assistant Upload Portal (MindKindler)

## 1. Objective
Implement a robust **EPP Assistant Upload Portal** to enable administrative assistants and EPPs to ingest unstructured external data (PDF reports, attendance logs, handwritten notes) into the structured MindKindler ecosystem. The system will leverage AI to extract structured data from documents, provide a "Human-in-the-Loop" staging area for verification, and ensure all imported data is auditable, versioned, and compliant.

**Core Value Proposition:**
- **Efficiency:** Replace manual data entry with AI-powered extraction (OCR + NLP).
- **Quality Assurance:** "Staging" workflow prevents bad AI data from polluting clinical records.
- **Traceability:** Every data point in a student profile can be traced back to its source document (Provenance).
- **Scale:** Support bulk uploads (e.g., end-of-term reports for a whole class).

**Non-Goals:**
- **Full Legal Case Management:** We are not replacing court e-filing systems.
- **Real-time Chat:** Communication about documents happens via existing messaging, not a new chat tool in the uploader.
- **Native Mobile App:** This is a responsive web portal, not a standalone iOS/Android binary (though mobile web support is required).

---

## 2. Phases & Timeline

### Phase 1: Inventory & Data Model
*Goal: Define schema for Documents, Extractions, and Staging.*
- Audit existing `src/components/dashboard/data-ingestion/document-uploader.tsx` and `functions/src/ai/processUploadedDocument.ts`.
- Define Firestore schema for `documents` (metadata), `document_staging` (AI results), and `reconciliation` (tasks).
- Integrate with `ai_provenance` for tracking extraction accuracy.

### Phase 2: Heuristic UX & Mobile Patterns
*Goal: Ensure the upload & review process is seamless on desktop and tablets.*
- Design the "Split View" Reviewer: Original PDF on left, Extracted Form on right.
- Mobile considerations: "Scan with Camera" flow (using HTML5 file input capture).
- Feedback loops for "Low Confidence" fields.

### Phase 3: Wireframes & Component Spec
*Goal: Componentize the UI.*
- Spec `UploadDropzone` (Single/Bulk).
- Spec `ExtractionReviewer` (The side-by-side reconciliation tool).
- Spec `ReconciliationInbox` (Task list for EPPs/Assistants).
- Define states: `Uploading`, `Processing`, `ReviewRequired`, `Approved`, `Rejected`.

### Phase 4: Implement Upload UI & Client-side Validation
*Goal: reliable file ingestion.*
- Implement resumable uploads (Firebase Storage).
- Client-side validation (File type, size limit, virus scan placeholder).
- Bulk upload UI with progress tracking per file.

### Phase 5: AI Extraction Pipeline
*Goal: Intelligent parsing.*
- Upgrade `functions/src/ai/processUploadedDocument.ts` to use real GenKit/Document AI flows.
- Implement specialized extractors: "Attendance Log", "Clinical Report", "Exam Results".
- Write results to `document_staging`.

### Phase 6: Review & Human Reconciliation UI
*Goal: The "Human-in-the-Loop" safety net.*
- Build the `ExtractionReviewer` component.
- Implement "Click-to-Correct": Clicking a field in the PDF highlights the form field (if possible via coordinate mapping, or simple manual entry).
- "Approve & Commit" action moving data from `staging` to `student` profile.

### Phase 7: Dedupe, Versioning & Manifests
*Goal: Data hygiene.*
- Hash-based deduplication to prevent re-uploading the same PDF.
- Document Versioning (`v1` -> `v2` if re-scanned).
- Manifest support for bulk imports (CSV + Zip of PDFs).

### Phase 8: Offline/Camera Capture
*Goal: Field usability.*
- Optimize mobile web flow for capturing multi-page documents via camera.
- Local caching of pending uploads (using `idb` / `localforage`).

### Phase 9: Consent, Sharing & Audit
*Goal: Compliance.*
- Ensure uploads are tagged with `consentStatus`.
- Role-based access: Assistants can *upload* and *prepare*, but only EPPs can *commit* clinical data.
- Full audit log of who changed what field during reconciliation.

### Phase 10: Tests, QA, Monitoring & Rollout
*Goal: Production readiness.*
- Unit tests for extractors and schema validation.
- E2E tests for Upload -> Extract -> Review -> Commit flow.
- Monitoring for "Extraction Failure Rate" and "Human Correction Rate".
- Rollout via feature flag `ENABLE_UPLOAD_PORTAL`.

---

## 3. Existing Files to Inspect

*   **UI:** `src/components/dashboard/data-ingestion/document-uploader.tsx` (Current MVP)
*   **Backend:** `functions/src/ai/processUploadedDocument.ts` (Mock extraction logic)
*   **Pipeline:** `src/integrations/documentAI/pipeline.ts` (Existing pipeline structure)
*   **Types:** `src/types/schema.ts` (Need to add `Document`, `Staging` types)
*   **Storage:** `firebase.json` (Storage rules)

---

## 4. Proposed Firestore Schema

**Collection:** `tenants/{tenantId}/documents/{docId}`
*The immutable record of the file.*
```typescript
interface DocumentMetadata {
  id: string;
  filename: string;
  storagePath: string; // gs://...
  hash: string; // SHA-256 for dedupe
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string; // userId
  uploadedAt: Timestamp;
  category: 'report' | 'attendance' | 'letter' | 'other';
  studentId?: string; // Optional linkage if known at upload
  status: 'processing' | 'staging' | 'committed' | 'archived';
}
```

**Collection:** `tenants/{tenantId}/document_staging/{stagingId}`
*The AI's "suggestion" awaiting human review.*
```typescript
interface DocumentStaging {
  id: string;
  docId: string;
  aiModel: string;
  provenanceId: string; // Link to ai_provenance
  confidenceScore: number;
  extractedData: Record<string, any>; // The structured guess
  validationErrors: string[]; // e.g., "Missing Date", "Confidence < 50%"
  status: 'ready_for_review' | 'reviewed' | 'committed' | 'discarded';
  assignedTo?: string; // EPP ID for review
}
```

**Collection:** `tenants/{tenantId}/assistant_upload_jobs/{jobId}`
*For tracking bulk operations.*
```typescript
interface UploadJob {
  id: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  status: 'uploading' | 'processing' | 'complete' | 'failed';
  errors: Array<{ fileName: string, error: string }>;
  createdBy: string;
}
```

**Collection:** `tenants/{tenantId}/reconciliation/{reconId}`
*Task tracking for the assistant/EPP.*
```typescript
interface ReconciliationTask {
  id: string;
  stagingId: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  status: 'pending' | 'resolved';
}
```

---

## 5. Security & Governance

*   **Roles:**
    *   `Assistant`: Can Upload, View Staging, Edit Staging (Corrections). Cannot Commit clinical data (unless `TrustedAssistant` flag is set).
    *   `EPP`: Can Upload, View, Edit, and **Commit** (Finalize).
    *   `TenantAdmin`: Can configure extraction rules and view audit logs.
*   **Storage Rules:**
    *   Raw uploads bucket: Write-only for generic users (via signed URL ideally), Read-only for Cloud Functions.
    *   Permanent bucket: Read-only for authorized users based on Student ID.

---

## 6. Acceptance Criteria & Test Matrix

| Feature | Acceptance Criteria | Test Level |
| :--- | :--- | :--- |
| **Upload** | User can drag-and-drop PDF. File appears in `documents` list. Metadata extracted. | E2E (Playwright) |
| **Extraction** | Upload triggers Cloud Function. `document_staging` doc created with JSON data. | Integration |
| **Review UI** | Split view shows PDF and Form. User can edit Form. Updates persist to Staging. | Component Unit |
| **Commit** | "Commit" button moves data to `student` profile. `documents` status -> `committed`. | E2E |
| **Security** | Assistant cannot see "Commit" button if permissions deny it. | Unit (RBAC) |
| **Mobile** | Camera capture works. UI responsive on iPad size. | Manual / Device |

---

## 7. Rollout Plan

1.  **Feature Flag:** `ENABLE_ASSISTANT_PORTAL` (boolean).
2.  **Pilot:** Deploy to "Staging Tenant" with 2 Assistant users.
3.  **Training:** Video tutorial on "How to Review & Reconciliation".
4.  **Telemetry:** Track `extraction_confidence` vs `human_correction_distance` to improve AI models over time.
5.  **Expansion:** Roll out to all EPPs after 1 week stable pilot.

---
Stage 0 complete. Ready for Stage 1 prompt.
