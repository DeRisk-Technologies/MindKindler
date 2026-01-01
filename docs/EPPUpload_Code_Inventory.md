# EPP Upload Portal - Code Inventory & Analysis

## 1. File Inventory

### UI Components
*   `src/components/dashboard/data-ingestion/document-uploader.tsx`: **Core UI.** Handles file selection (Dropzone), metadata input (Category, Target), and upload to mock storage + Firestore `documents` creation. Needs refactoring to support 'Assistant' mode (bulk upload, staging queue).
*   `src/app/dashboard/data-ingestion/page.tsx`: **Page Wrapper.** Renders the uploader.

### Backend Functions
*   `functions/src/ai/processUploadedDocument.ts`: **Extraction Logic.** Cloud Function triggered by `documents/{docId}` creation. Currently simulates AI delay and mocks extraction based on `category`. Writes result to `extraction_staging`. Needs upgrade to real GenKit flow.
*   `src/integrations/documentAI/pipeline.ts`: **Client-Side Pipeline?** Appears to be a separate "Document AI v2" logic using `docExtractionRuns` collection. Need to unify this with the Cloud Function approach. The `commitRun` function has logic for moving staged data to final `students/` or `importJobs`, which is useful for Phase 6.

### AI & Flows
*   `src/ai/flows/extract-document-data.ts`: **Genkit Flow Definition.** Defines the prompt and Zod schema for extraction. Currently unused by the Cloud Function? Needs to be connected.

### Firestore Collections (Inferred & Found)
*   `documents`: Raw metadata. Fields: `userId`, `targetId`, `targetType`, `fileName`, `fileUrl`, `category`, `status`.
*   `extraction_staging`: Output of extraction. Fields: `documentId`, `rawExtraction`, `confidenceScore`.
*   `docExtractionRuns`: Used by `pipeline.ts` (seemingly redundant with `documents`?).
*   `importJobs`: Used for bulk commits.

---

## 2. Data Model Strategy

We need to consolidate `documents` and `docExtractionRuns` into a single canonical source of truth for the Upload Portal.

### 1. Documents Collection (Canonical)
**Path:** `tenants/{tenantId}/documents/{docId}`
*   **Purpose:** Immutable record of the file asset.
*   **Fields:**
    *   `tenantId`: string
    *   `fileRef`: string (Storage path)
    *   `hash`: string (SHA-256 for dedupe)
    *   `uploadedBy`: string (User ID)
    *   `uploadedAt`: Timestamp
    *   `status`: 'uploading' | 'processing' | 'review_required' | 'published' | 'archived' | 'error'
    *   `metadata`: {
        `category`: 'academic_record' | 'attendance' | ...,
        `originalName`: string,
        `sizeBytes`: number,
        `mimeType`: string
    }
    *   `context`: {
        `studentId`?: string, // If known at upload
        `schoolId`?: string
    }
    *   `processing`: {
        `attemptCount`: number,
        `lastError`?: string,
        `stagingId`?: string // Link to extraction result
    }

### 2. Document Staging (The "Inbox")
**Path:** `tenants/{tenantId}/document_staging/{stagingId}`
*   **Purpose:** Mutable workspace for Assistant/EPP to correct AI errors before committing.
*   **Fields:**
    *   `documentId`: string
    *   `status`: 'ready' | 'in_review' | 'approved' | 'rejected'
    *   `aiResult`: {
        `data`: any (Structured JSON),
        `confidence`: number,
        `provenanceId`: string
    }
    *   `userCorrections`: any (User edits overlay)
    *   `finalData`: any (Merged AI + User data)
    *   `assignedTo`: string (EPP ID for approval)
    *   `reviewedBy`: string
    *   `reviewedAt`: Timestamp

### 3. Bulk Jobs (Assistant Workflow)
**Path:** `tenants/{tenantId}/upload_jobs/{jobId}`
*   **Purpose:** Grouping multiple uploads.
*   **Fields:**
    *   `batchId`: string
    *   `totalFiles`: number
    *   `progress`: { processed: 5, pending: 2, error: 0 }
    *   `docIds`: string[]

---

## 3. Gap Analysis

1.  **Redundant Pipelines:** We have `processUploadedDocument.ts` (Cloud Function) and `pipeline.ts` (Client-side mock). **Decision:** Deprecate `pipeline.ts` logic and move all logic to the robust Cloud Function.
2.  **Missing Bulk UI:** `document-uploader.tsx` only handles single files. Need a "Batch Upload" mode.
3.  **Missing Review UI:** No UI exists to view `extraction_staging` data side-by-side with the PDF.
4.  **Security:** Current `processUploadedDocument` has no tenant isolation (uses global `documents`). Need to nest under `tenants/{tid}`.

---

## 4. Security & Permissions

*   **Assistants:**
    *   `create` on `documents`.
    *   `read` / `write` on `document_staging`.
    *   **CANNOT** write to `students` (Core profile) directly. They must use a "Commit" Cloud Function that verifies `status === 'approved'`.
*   **EPPs:**
    *   Full access. Can "Commit" staging docs to final destination.

---

## 5. Next Steps (Stage 2)
Focus on **Phase 2 (UX)** and **Phase 3 (Wireframes)**.
We need to design the "Split View" reconciler and the Bulk Upload dashboard.

---
Stage 1 complete. Ready for Stage 2 prompt.
