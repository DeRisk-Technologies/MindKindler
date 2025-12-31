# Integration Phase 5A-2 Plan: Document AI v2

## Objective
Upgrade the basic document upload feature into a robust **Document AI v2 Pipeline**. This system will intelligently ingest unstructured documents (PDFs, Images), classify them, extract structured data using customizable templates, and allow user correction before importing the clean data into MindKindler's operational collections.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **DocExtractionTemplate (New):**
    - `id`, `tenantId`, `name`, `category`, `status`
    - `targetEntity` (student, result, attendance)
    - `mapping`: { `extractedField`: `canonicalField` }
- [ ] **DocExtractionRun (New):**
    - `id`, `fileRef`, `status` ('extracted', 'needs_review', 'approved')
    - `extractedData`: JSON blob (raw output).
    - `corrections`: JSON blob (user edits).
    - `validationErrors`: { row, message }[]

## 2. Document Pipeline Service
**Path:** `src/integrations/documentAI/pipeline.ts` (New)

- [ ] **`processDocument(file, templateId)`**:
    - Mock extraction (simulates OCR returning JSON).
    - Auto-map fields based on template.
    - Run validation rules.
    - Create `DocExtractionRun`.
- [ ] **`applyCorrections(runId, edits)`**: Updates the run record.
- [ ] **`commitRun(runId)`**: Converts valid data into an `ImportJob` for final ingestion.

## 3. UI Implementation
**Path:** `src/app/dashboard/integrations/document-ai` (New Module)

- [ ] **Dashboard (`/page.tsx`)**:
    - List recent runs.
    - "New Extraction" button.
- [ ] **Wizard (`/new/page.tsx`)**:
    - **Upload**: File picker.
    - **Classify**: Dropdown to select "Category" (Result, Attendance, etc.).
    - **Template**: Select extraction template.
    - **Preview**: Table showing mock extracted data.
    - **Action**: "Extract & Review".
- [ ] **Review Interface (`/[runId]/page.tsx`)**:
    - **Split View**: Original File (Placeholder) vs Extracted Table.
    - **Inline Edit**: Editable table cells to fix OCR errors.
    - **Validation**: Highlight rows with errors.
    - **Commit**: "Approve & Import" button.

## 4. Feedback Loop
- [ ] **Auto-Learning**: When a user corrects a column mapping, store this preference (Mock logic: just log it for now).

## 5. Execution Steps
1.  **Schema**: Add Template & Run types.
2.  **Engine**: Build pipeline logic (Mock OCR).
3.  **UI**: Build Dashboard, Wizard, and Review pages.
4.  **Integration**: Connect "Commit" to the existing CSV Importer logic (reuse `processImport`).

## Manual Test Checklist
- [ ] **Upload**: Upload a dummy PDF "Class Results".
- [ ] **Extract**: Select "Results" category. See mock table appear.
- [ ] **Correct**: Edit a student's name in the table.
- [ ] **Import**: Click Approve. Verify data appears in Student/Results collections.
