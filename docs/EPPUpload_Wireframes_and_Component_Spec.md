# EPP Upload Portal: Wireframes & Component Spec

## 1. Wireframes

### A) Assistant Upload Dashboard (`/dashboard/uploads`)
*Hub for all upload activity.*

**Desktop:**
*   **Header:** "Assistant Upload Portal" | [Scan Document (Mobile)] | [New Upload]
*   **Stats Cards:** "Pending Review (5)", "Failed Extractions (1)", "Processed Today (12)".
*   **Tabs:** "Active Jobs" | "Completed" | "My Staging Queue".
*   **Active Jobs Table:**
    *   Columns: Date, Batch ID, File Count, Status (Uploading/Processing/Done), Actions.
    *   Row Actions: "View Batch", "Retry Errors".

**Mobile:**
*   **Action Bar:** Large "Camera Scan" button (Primary). "Upload File" (Secondary).
*   **Recent Activity:** List of last 5 uploads with simple status icons (Spinner, Green Check, Yellow Alert).

### B) Single/Bulk Upload Flow
*Unified dropzone for one or many files.*

*   **Step 1: Selection**
    *   Dropdown: "Document Category" (e.g., Attendance, Clinical Report).
    *   Search: "Link to Student (Optional)". If multiple files, can tag bulk or skip.
*   **Step 2: Dropzone**
    *   "Drag files here or click to browse".
    *   Support for `application/pdf`, `image/*`, `text/csv`.
    *   **Duplicate Check:** As files drop, show spinner -> "Ready" or "Duplicate Warning".
*   **Step 3: Review List (Pre-Upload)**
    *   List of files to be uploaded.
    *   Thumbnail preview.
    *   Remove button.
*   **Step 4: Upload**
    *   Progress bar (Overall & Per File).
    *   Success message: "5 Files Uploaded. AI Processing started."

### C) Extraction Staging Queue (`/dashboard/uploads/staging`)
*The "Inbox" for AI results.*

*   **Filter Bar:** "My Uploads" | "All Pending" | "Low Confidence Only".
*   **List View:**
    *   Card per document.
    *   Left: Thumbnail.
    *   Center: "Report_Spring_2024.pdf" -> Extracted as "Academic Record".
    *   Right: Confidence Badge (95% Green, 40% Red).
    *   Action: [Review & Reconcile].

### D) Split-View Reconciler (`/dashboard/uploads/staging/[id]`)
*The core work surface.*

*   **Left Pane (PDF Viewer):**
    *   Zoom controls.
    *   Pan/Scroll.
    *   (Future) Bounding boxes overlay.
*   **Right Pane (Extraction Form):**
    *   **Header:** "AI Extraction Results". Warning: "Low confidence in 2 fields".
    *   **Form Fields:** Mapped to schema (e.g., Student Name, Date, Grades).
    *   **Field State:**
        *   Green border: High confidence.
        *   Yellow border: Low confidence (Needs check).
        *   Red border: Validation error (e.g., "Date in future").
    *   **Actions:**
        *   [Save Draft] (Keep in staging).
        *   [Submit for Approval] (If Assistant).
        *   [Publish to Record] (If EPP/Trusted).

### E) Mobile Camera Capture
*Simplified flow for field work.*

*   **View:** Full-screen camera stream (via OS native picker).
*   **Post-Capture:**
    *   "Retake" or "Use Photo".
    *   "Crop" tool (Client-side canvas).
    *   "Upload" -> Trigger Phase 4 logic.

---

## 2. Component Specifications

### 1. `AssistantUploadDashboard`
*Container for the portal.*
*   **Path:** `src/components/dashboard/data-ingestion/AssistantUploadDashboard.tsx`
*   **Props:** `userId`, `role`.
*   **Data:** Subscribes to `assistant_upload_jobs` where `createdBy == userId`.

### 2. `SmartDropzone`
*Handles file selection, hashing, and compression.*
*   **Path:** `src/components/dashboard/data-ingestion/SmartDropzone.tsx`
*   **Props:**
    *   `onFilesSelected(files: FileWithMeta[])`: Callback.
    *   `allowMultiple`: boolean.
*   **Logic:**
    *   Calculates SHA-256 hash on drop.
    *   Checks `documents` collection for duplicates.
    *   Resizes images > 2048px (using `browser-image-compression`).

### 3. `ExtractionReconciler`
*Split-view editor.*
*   **Path:** `src/components/dashboard/data-ingestion/reconciler/ExtractionReconciler.tsx`
*   **Props:** `stagingDocId`.
*   **State:** Local form state mirroring `extractedData`.
*   **Firestore:**
    *   Read `document_staging/{id}`.
    *   Write updates to `document_staging/{id}` (userCorrections).
    *   Action `commit`: Calls Cloud Function `commitStagedDocument`.

### 4. `StagingQueueList`
*List of pending items.*
*   **Path:** `src/components/dashboard/data-ingestion/StagingQueueList.tsx`
*   **Props:** `filter`: 'mine' | 'all'.
*   **UI:** `DataTable` with status badges.

---

## 3. Data Flow: Single Upload to Publish

1.  **Upload:**
    *   User drops file. `SmartDropzone` hashes it.
    *   Client uploads to Storage `gs://.../uploads/{id}`.
    *   Client creates `documents/{id}` with `status: 'uploading'`.
2.  **Processing:**
    *   Cloud Function `processUploadedDocument` triggers.
    *   Calls AI (Genkit).
    *   Creates `document_staging/{stagingId}` with `rawExtraction`.
    *   Updates `documents/{id}` status to `review_required`.
3.  **Notification:**
    *   UI listens to `documents/{id}`. Shows "Ready for Review".
4.  **Review:**
    *   User opens Reconciler.
    *   Corrects "Student Name" spelling.
    *   Clicks "Submit".
5.  **Commit:**
    *   If EPP: Calls `commitStagedDocument`.
        *   Moves data to `students/{id}/reports`.
        *   Updates `documents/{id}` status to `published`.
    *   If Assistant: Updates `document_staging` status to `pending_approval`.

---

## 4. Accessibility & Offline

*   **Keyboard:** The Reconciler form must be fully navigable via Tab. Shortcuts (e.g., `Alt+N`) to skip to next field.
*   **Offline:**
    *   Uploads initiated offline are queued in `IndexedDB` (using `idb` library).
    *   Service Worker attempts background sync when online.
    *   Reconciler is *read-only* offline unless data was prefetched.

---
Stage 3 complete. Ready for Stage 4 prompt.
