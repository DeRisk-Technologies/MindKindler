# EPP Upload Portal: Heuristic UX Review

## 1. Executive Summary
The EPP Assistant Upload Portal aims to reduce the "data entry tax" on Educational Psychologists by enabling administrative assistants to ingest, categorize, and validate external documents. The current upload experience is desktop-centric and lacks the rigorous "staging" workflow needed for clinical safety. 

**Core Persona:** "Alex," an Administrative Assistant. Alex uses a mix of a dedicated desktop workstation and an iPad while moving between school offices. Alex needs to scan 20+ attendance logs in one go and ensure they are attached to the right student profiles without bothering the Senior EPP.

---

## 2. Key User Tasks & Workflows

### Task A: Bulk Ingestion (The "Friday Afternoon" Rush)
*User Goal:* Upload a batch of PDFs (reports from 5 different schools) and go home.
*Current State:* Single file upload only. No tracking of "Which file failed?".
*Target State:* A "Batch Dropzone" that accepts multiple files. A robust "Upload Job" dashboard showing progress per file (e.g., "3/5 Extracted, 2 Errors").

### Task B: Mobile Capture (The "School Visit")
*User Goal:* Snap a photo of a physical "Referral Letter" and upload it immediately securely.
*Current State:* No camera integration. Relies on taking a photo, saving to gallery, then uploading.
*Target State:* "Scan Document" button on mobile web. Opens camera directly (`capture="environment"`). Auto-crops and compresses client-side before upload to save bandwidth.

### Task C: Verification & Reconciliation (The "Safety Net")
*User Goal:* Correct AI errors (e.g., AI read "Grade 5" as "Grade S") before data becomes permanent.
*Current State:* "Black Box" processing. Data is either extracted or failed. No editing UI.
*Target State:* **Split View Reconciler.**
    *   **Left:** PDF Viewer with zoom/pan.
    *   **Right:** Form fields pre-filled by AI. Confidence score indicators (Red/Yellow/Green).
    *   **Action:** "Approve for EPP Review" (Assistant) or "Commit to Record" (EPP).

### Task D: Escalation & Consent
*User Goal:* Flag a sensitive document (e.g., "Safeguarding Incident") for immediate EPP attention.
*Current State:* No priority flagging during upload.
*Target State:* "Priority" toggle during review. Explicit "Consent Check" (Does this student have a signed consent form for this data?).

---

## 3. Heuristic Evaluation (Nielsen’s 10 + Mobile)

### 1. Visibility of System Status
*   **Issue:** Bulk uploads often fail silently or partially without clear feedback.
*   **Fix:** Persistent "Upload Tray" at the bottom of the screen. "Processing 3/10..." with a progress bar.
*   **Severity:** P1

### 2. Error Prevention (Safety)
*   **Issue:** Duplicate uploads (same PDF twice) clutter the record.
*   **Fix:** **P0 Requirement.** Hash-based check (SHA-256) on client-side select. Warning: *"This file appears to be a duplicate of 'Report_A.pdf' uploaded yesterday."*
*   **Severity:** P0

### 3. Recognition Rather Than Recall
*   **Issue:** AI extraction is opaque. Users don't know *why* a field was filled.
*   **Fix:** When a user focuses a form field, highlight the corresponding region in the PDF viewer (Bounding Box visualizer).
*   **Severity:** P2

### 4. Flexibility & Efficiency of Use
*   **Issue:** Correcting 50 forms is tedious.
*   **Fix:** "Tab-to-Next-Low-Confidence". A shortcut key (e.g., Tab) jumps specifically to fields where AI confidence < 80%.
*   **Severity:** P2

### 5. Mobile: Bandwidth & Storage
*   **Issue:** Uploading 10MB raw photos on school Wi-Fi is slow/unreliable.
*   **Fix:** Client-side compression (convert to high-quality JPEG/WebP or resize PDF) *before* upload. Service Worker caching for offline queue.
*   **Severity:** P1

---

## 4. Safety & Governance Heuristics

*   **Assistant Limits:** Assistants should see a "Submit for Approval" primary action, not "Publish". Only "Trusted Assistants" or EPPs see "Publish".
*   **Consent Warning:** If `student.consent.shareReports` is false, show a warning banner on the Review screen: *"Consent Warning: Strict Internal Use Only."*
*   **Audit Trail:** Every edit made during reconciliation must be logged. *"Field 'Grade' changed from 'S' to '5' by Alex."*

---

## 5. Prioritized Fixes (P0 - P3)

### P0: Must-Have for Launch (Safety & Core Utility)
1.  **Staging Workflow:** Implement `document_staging` UI. No data writes to `students` collection without explicit "Commit" action.
2.  **Role-Based Actions:** Hide "Commit" button for Assistants. Show "Request Review" instead.
3.  **Duplicate Detection:** Client-side hash check before upload start.
4.  **Bulk Upload UI:** Drag-and-drop multiple files + Job Progress Tracking.

### P1: High Priority (Usability)
1.  **Split View Reconciler:** Side-by-side PDF and Form.
2.  **Mobile Camera Capture:** Direct integration with `input type="file" accept="image/*" capture`.
3.  **Confidence Indicators:** Visual cues (Yellow border) for low-confidence fields.

### P2: Medium Priority (Efficiency)
1.  **Client-Side Compression:** Resize images to max 2048px before upload.
2.  **Bounding Boxes:** Overlay extracted text boxes on PDF (requires sophisticated OCR response handling).

### P3: Low Priority (Future)
1.  **Auto-Rotation:** Detect upside-down scans and rotate.
2.  **Offline Queue:** Full IndexedDB support for queuing uploads while offline.

---

## 6. Microcopy Suggestions

| Context | Bad / Generic | Good / Assistant-Friendly |
| :--- | :--- | :--- |
| **Status** | "Processing..." | "AI is reading the document..." |
| **Low Confidence** | "Error in field" | "Please verify: Is this 'Grade 5' or 'Grade S'?" |
| **Duplicate** | "File exists" | "Duplicate Warning: We found a matching file uploaded by [User] on [Date]." |
| **Success (Assistant)** | "Saved" | "Sent to Dr. [EPP] for final sign-off." |
| **Success (EPP)** | "Saved" | "Verified & Published to Student Record." |
| **Bulk** | "Upload 5 files" | "Start Batch Processing (5 items)" |

---
Stage 2 complete. Ready for Stage 3 prompt.
