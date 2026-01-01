# Report Code Inventory & Analysis

## 1. File Inventory

### Backend & AI Functions
*   `functions/src/ai/generateClinicalReport.ts`: **Core.** Cloud Function that runs the Genkit AI flow. Inputs: `notes`, `history`, `transcript`, `tenantId`. Output: JSON structure (`summary`, `recommendations`, etc.). Includes provenance logging.
*   `src/ai/flows/generate-consultation-report.ts`: **Frontend Mirror.** Type definitions and Zod schemas for the report flow. Used for client-side validation or prompt construction logic.
*   `src/ai/utils/prompt-builder.ts`: **Utility.** Helper to build consistent system prompts (tone, language, glossary injection).
*   `src/ai/utils/glossarySafeApply.ts`: **Utility.** Post-processor to enforce tenant-specific terminology (e.g., "Student" -> "Learner") on the generated report.
*   `functions/src/ai/utils/provenance.ts`: **Logging.** Saves AI execution metadata (prompt, response, latency) to `ai_provenance` collection.

### Frontend UI
*   `src/app/dashboard/reports/editor/[id]/page.tsx`: **Main UI.** The existing "Report Editor" page. Currently a basic implementation using `Textarea` for sections. Needs upgrade to Rich Text (TipTap) and Sidebar.
*   `src/components/dashboard/reports/adhoc-generator.tsx`: **Trigger.** UI component likely used to initiate the report generation process (calls the Cloud Function).
*   `src/app/dashboard/reports/builder/page.tsx`: **Template/List.** Appears to be a list or builder view for reports. Needs inspection to see if it lists templates.
*   `src/components/ui/citations.tsx`: **Component.** Reusable UI for displaying a list of citations. Used in Intelligence/GovIntel pages, reusable for the Report Sidebar.
*   `src/ai/knowledge/citationFormat.ts`: **Utility.** Helper to format citation strings (e.g., "Author, Title (Year)").

### Data & schema
*   `src/types/schema.ts`: **Types.** Contains the `Report` interface. Needs updating to support the new `sections` structure and versioning.
*   `src/services/case-service.ts`: **Service.** Likely contains methods for fetching case data (`evidence`) which is a dependency for the report generator.

## 2. AI Integration Point

*   **Invoked at:** `functions/src/ai/generateClinicalReport.ts` (triggered via `httpsCallable('generateClinicalReport')`).
*   **Inputs:**
    *   `tenantId` (string)
    *   `studentId` (string)
    *   `notes` (string/array) - Clinical observations
    *   `history` (string/array) - Background info
    *   `transcript` (string) - Optional session transcript
    *   `glossary` (object) - Term replacement map
*   **Outputs:**
    *   JSON object matching `ReportSchema`: `{ summary, recommendations, clinicalImpression, nextSteps }`.
    *   *Note:* Current schema is simple. Needs to be expanded to support flexible `sections` for the generic editor.

## 3. Data Model Strategy

### Reports Collection
**Path:** `tenants/{tenantId}/reports/{reportId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `studentId` | string | Link to Student Profile |
| `caseId` | string | Link to Case (optional if ad-hoc) |
| `title` | string | Display title (e.g. "EHCP Assessment") |
| `templateType` | string | ID of the template used (e.g. "standard_clinical") |
| `status` | string | `draft` \| `review` \| `signed` \| `archived` |
| `version` | number | Current version number (starts at 1) |
| `content` | map | `{ sections: [ { id, title, body, lastAiGeneratedAt } ] }` |
| `evidence` | array | `[{ id, sourceId, type, label }]` - Cached references used in this report |
| `attachments` | array | File paths to exported PDFs |
| `ai_provenanceId` | string | Link to the specific AI run that generated the draft |
| `redactionLevel` | string | `none` \| `partial` |
| `createdBy` | string | User UID |
| `signedBy` | string | User UID (only if status=signed) |
| `signedAt` | timestamp | |

### Report Versions (Subcollection)
**Path:** `tenants/{tenantId}/reports/{reportId}/versions/{versionId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `versionNumber` | number | e.g. 1, 2, 3 |
| `content` | map | Snapshot of the content map |
| `changeLog` | string | Auto-generated summary of changes (optional) |
| `committedBy` | string | User UID |
| `committedAt` | timestamp | |

### Exports (Separate Collection)
**Path:** `tenants/{tenantId}/report_exports/{exportId}`
*   Used for secure download links.
*   Fields: `reportId`, `version`, `storagePath`, `expiresAt`, `generatedBy`.

## 4. Security & Permissions

*   **EPPs / Clinicians:**
    *   `create`, `read`, `update` on `reports` (own tenant).
    *   `create` on `versions` (via "Finalize" function).
*   **School Admins (Senco):**
    *   `read` on `reports` where `status == 'signed'`.
    *   **NO** access to drafts.
*   **Parents / Students:**
    *   `read` on `report_exports` (if explicitly shared via link/portal).
    *   Direct Firestore access restricted; typically accessed via a secure Proxy Function or signed URL.

## 5. Next Steps (Stage 2)
Focus on **Phase 1 (Data Model & Inventory)** and **Phase 2 (UX Heuristics)**. We need to:
1.  Update `src/types/schema.ts` to reflect the robust `Report` interface.
2.  Refactor `functions/src/ai/generateClinicalReport.ts` to return the new `sections` format instead of the flat JSON.
3.  Design the "Editor Layout" component structure.

---
Stage 1 complete. Ready for Stage 2 prompt.
