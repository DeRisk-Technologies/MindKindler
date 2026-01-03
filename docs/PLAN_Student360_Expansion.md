# Student 360 Expansion Plan: True 360 Data Management

## 1. Objective
Expand the existing "Student 360" system into a comprehensive, trusted, and compliant "True 360" information management system. This involves a complete redesign of the data model to support field-level provenance, a unified student/parent creation workflow, robust verification checklists, and deep integration with AI Guardian for privacy and safeguarding.

## 2. Goals
- **Trust & Provenance:** Every data point has a source, confidence score, and verification status.
- **Unified Workflow:** "Single Guided 360 Workflow" for creating students and parents simultaneously.
- **Compliance:** Built-in GDPR/UK privacy controls, consent management, and redaction.
- **Safety:** AI Guardian integration for safeguarding triggers and data protection.
- **Efficiency:** Automated prefill via OCR and LMS integrations.

## 3. Implementation Phases (3 Sprint Plan)

### Phase 1: Foundation - Data Model & Core UI (Sprint 1)
**Goal:** Establish the trusted data model and the primary entry workflow.

*   **1.1 Data Model Expansion (`src/types/schema.ts`)**
    *   Define `ProvenanceMetadata` (source, confidence, verified).
    *   Define `VerificationTask` and checklist structures.
    *   Expand `ParentRecord` for multi-parent, complex families.
    *   Expand `StudentRecord` with new modular sections (Foster, Discipline, Health, etc.).
    *   Define `ConsentRecord` schema.

*   **1.2 Student Service Updates (`src/services/student360-service.ts`)**
    *   Implement atomic creation of Student + Parent(s).
    *   Implement `updateVerificationStatus` methods.
    *   Implement `recordTrustScore` calculation logic.

*   **1.3 Unified Creation UI (`src/components/student360/`)**
    *   `StudentEntryForm.tsx`: Main wizard/form for creation.
    *   `ParentEntryForm.tsx`: Inline, multi-instance parent editor.
    *   `VerificationChecklist.tsx`: Side-panel for managing verification tasks.
    *   `ProvenanceBadge.tsx`: UI component to show source/confidence.

### Phase 2: Integrations & Automation (Sprint 2)
**Goal:** Reduce manual entry through OCR and LMS integrations.

*   **2.1 OCR Pipeline**
    *   `DocumentStaging` service/schema.
    *   UI for uploading docs (Birth Cert, Reports) and reviewing extracted data.
    *   Map extracted data to `Student` fields with `source: 'ocr'`.

*   **2.2 LMS Integration Stub**
    *   `OneRoster` or CSV import utility.
    *   Reconciliation UI: "Merge Conflict" view for School Data vs. Manual Data.

*   **2.3 Verification Workflow**
    *   Auto-generate verification tasks based on new data (e.g., "Verify DOB against uploaded Birth Cert").
    *   Task assignment and completion flows.

### Phase 3: Privacy, Guardian & Rollout (Sprint 3)
**Goal:** Enforce safety, privacy, and auditability.

*   **3.1 Access Control & Redaction**
    *   Implement field-level masking based on roles (e.g., specific discipline records hidden from non-EPPs).
    *   `RedactionService`: Helper to strip fields based on `redactionLevel` (FULL, PARENT_SAFE, etc.).

*   **3.2 AI Guardian Integration**
    *   Update `src/ai/guardian/` to check outgoing data against Consent Records.
    *   Implement PII/Safeguarding detectors on input/output.
    *   Audit logging for all AI interactions (`ai_provenance`).

*   **3.3 Consent Management**
    *   UI for managing `ConsentRecords` (Sharing, Recording, etc.).
    *   Enforce consent checks before external sharing.

*   **3.4 Compliance Templates**
    *   Implement logic to load specific regulatory checks (UK GDPR, etc.) based on tenant settings.

## 4. Acceptance Criteria
- [ ] **Data Model:** All student fields support provenance metadata.
- [ ] **Creation Flow:** User can create a student and 2 parents in one session.
- [ ] **Verification:** "Trust Score" is calculated; checklist tasks update verification status.
- [ ] **Privacy:** Unauthorized roles see redacted data for sensitive fields.
- [ ] **Audit:** All changes and AI outputs are logged with provenance.

## 5. Technical Notes
- **Firestore:** Use subcollections for high-volume items like `audit_logs` or `timeline`, but keep `parents` and `consent` often accessed with the student profile in the document or a closely linked subcollection depending on query patterns. (Decision: `parents` as array or subcollection? Brief suggests array for atomic write, but subcollection better for scaling. Will use subcollection `family_members` but support batch write).
- **Security:** Firestore Rules must be updated to respect the new field-level privacy flags.
