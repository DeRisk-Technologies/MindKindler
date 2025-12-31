# Integration Phase 5A-1 Plan: Integration Hub & CSV Ingestion

## Objective
Establish the **Integration Hub**, a central module for managing data connectors. The initial focus (MVP) is a robust **CSV/Excel Ingestion Pipeline** that allows users to map, validate, and import bulk data (Students, Teachers, Classes) into MindKindler, while scaffolding the architecture for future standard connectors (OneRoster, Ed-Fi).

## 1. Data Model Strategy
**File:** `src/types/schema.ts` (Update)

- [ ] **IntegrationConfig (Enhance):**
    - `id`, `type` ('csv', 'oneroster', 'edfi'), `status`
    - `config`: { `mappingRules` }
- [ ] **ImportJob (New):**
    - `id`, `integrationId`, `status` ('validating', 'importing', 'completed', 'failed')
    - `stats`: { `total`, `valid`, `error` }
    - `errorLog`: { `row`, `message` }[]
    - `fileUrl` (for CSV source)
- [ ] **DataMapping (New):**
    - `id`, `name`, `entityType` ('student', 'teacher')
    - `fieldMap`: { `csvHeader`: `systemField` }

## 2. Canonical Schema Definition
**Path:** `src/integrations/schemas/canonical.ts` (New)

- Define standard interfaces for `StudentImport`, `TeacherImport`, `ClassImport`.
- These interfaces will serve as the target for all mappers.

## 3. CSV Pipeline
**Path:** `src/integrations/csv/importer.ts` (New)

- **`parseCSV(file)`**: Reads headers and rows.
- **`validateRows(rows, mapping)`**: Checks required fields and types against Canonical Schema.
- **`processImport(rows, mapping)`**: Writes valid records to Firestore (`students`, `users`, etc.).

## 4. UI Implementation
**Path:** `src/app/dashboard/integrations` (New Module)

- [ ] **Hub (`/page.tsx`):**
    - List active integrations.
    - "New Integration" cards (CSV active, others "Coming Soon").
    - Recent Job History table.
- [ ] **CSV Wizard (`/csv/new/page.tsx`):**
    - **Step 1:** Upload File & Detect Headers.
    - **Step 2:** Mapper UI (Left: CSV Header -> Right: System Field).
    - **Step 3:** Validation Preview (Show first 5 rows + error summary).
    - **Step 4:** Execute Import.
- [ ] **Job Detail (`/jobs/[id]/page.tsx`):**
    - Progress bar.
    - Error log download.

## 5. Execution Steps
1.  **Schema**: Add Integration/Job types.
2.  **Canonical**: Define target interfaces.
3.  **Engine**: Build CSV parser and validator logic.
4.  **UI**: Build Hub and Wizard pages.
5.  **Integration**: Connect Wizard to Engine.

## Manual Test Checklist
- [ ] **Create**: Go to Integrations > New CSV. Upload a student list (Name, DOB, Email).
- [ ] **Map**: Map "Full Name" -> `firstName` + `lastName` (or just simple mapping).
- [ ] **Validate**: Run validation. Ensure it catches missing required fields.
- [ ] **Import**: Execute. Go to Student Directory and verify new records appear.
- [ ] **Logs**: Check Job History for the completion record.
