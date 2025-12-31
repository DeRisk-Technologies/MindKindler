# Government Intelligence Phase 4B-1 Plan: Procurement & Compliance Packs

## Objective
Enable government officials to generate "Procurement-Ready" compliance packs. These are comprehensive, auto-generated document bundles (PDF/HTML) that aggregate operational data, security posture, training records, and budget projections to support funding applications or audits.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **ProcurementPack (New):**
    - `id`, `tenantId`, `scopeType`, `scopeId`
    - `jurisdiction`, `status` ('draft' | 'finalized')
    - `snapshotRef` (Link to govSnapshot)
    - `scenarioRef` (Link to planningScenario)
    - `documents`: { `templateId`, `title`, `contentHtml`, `citations`[] }[]
    - `exportUrl`
- [ ] **ProcurementTemplate (Hardcoded/Config):**
    - Defines structure for "Executive Summary", "Security Overview", etc.

## 2. Generator Service
**Path:** `src/govintel/procurement/generator.ts` (New)

- [ ] **`generatePack(context)`**: Orchestrator.
- [ ] **`generateDocument(templateId, context)`**:
    - **Executive Summary**: Pulls top KPIs from snapshot.
    - **Security**: Boilerplate GDPR/ISO text + dynamic stats (e.g. "100% data residency in UK").
    - **Budget**: Embeds the `PlannerOutputs` from the selected scenario.
    - **Training**: Summarizes completion rates.
- [ ] **Citations**: Attaches relevant rulebooks from the Vault.

## 3. UI Implementation
**Path:** `src/app/dashboard/govintel/procurement` (New Module)

- [ ] **List Page (`/page.tsx`)**:
    - "Create New Pack" Wizard.
    - List of historical packs.
- [ ] **Detail/Edit Page (`/[id]/page.tsx`)**:
    - Sidebar listing generated documents (Exec Summary, Budget, etc.).
    - Main area: Editable Preview (Textarea/Rich Text).
    - **Citations Panel**: Reuse `Citations` component.
    - **Actions**: "Regenerate", "Export Bundle".

## 4. Templates (Initial Set)
1.  **Executive Summary**: Value prop + Key Metrics.
2.  **Compliance Statement**: List of active Policy Rules + Safeguarding stats.
3.  **Resource Plan**: Staffing & Budget (from Planner).
4.  **Training Strategy**: Completion rates + Learning Paths.

## 5. Execution Steps
1.  **Schema**: Add `ProcurementPack`.
2.  **Generator**: Build the logic to stitch data into text templates.
3.  **UI**: Build Wizard and Editor.
4.  **Integration**: Link Planner results to the Generator context.

## Manual Test Checklist
- [ ] **Create**: Go to "Procurement Packs". Click Create. Select "Council" scope + Latest Snapshot + "High Growth" Scenario.
- [ ] **Verify Docs**: Check that "Resource Plan" document contains numbers matching the scenario (e.g., "Budget: $1.2M").
- [ ] **Edit**: Modify the Executive Summary text. Save.
- [ ] **Export**: Click "Export Bundle". Verify (toast/log) that the pack is finalized.
