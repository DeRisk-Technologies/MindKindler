# Plan: Report Writing Experience (MindKindler)

## 1. Objective
Implement a polished, professional report-writing environment for Educational Psychologists (EPPs) and Clinicians. The goal is to move from a basic "AI Text Dump" to a comprehensive **AI-Assisted Editor** that supports drafting, evidence citation, redaction, collaborative review, and secure finalizing.

**Core Value Proposition:**
- **Speed:** Reduce report writing time by 60% using AI drafts grounded in case evidence.
- **Accuracy:** Ensure every claim is backed by cited evidence (Observation, Assessment, Interview).
- **Safety:** Role-based redaction and strict version control (Draft vs. Final).
- **Compliance:** Auditable AI provenance and standardized templates.

**Non-Goals:**
- Real-time multiplayer editing (like Google Docs) is NOT a priority for V1. Locking/checkout mechanism is sufficient.
- Custom template *designer* (we will use code-based standard templates initially).
- Printing directly to physical printers (PDF export is the target).

---

## 2. Phases & Timeline

### Phase 1: Inventory & Data Model
*Goal: Define the schema and inspect current "skeleton" implementations.*
- Audit existing `generateClinicalReport` Cloud Function and frontend hooks.
- Define Firestore schema for `reports`, `reportVersions`, and `citations`.
- Identify gaps in current "Evidence" data structures (Cases, Assessments, Observations).

### Phase 2: Heuristic UX Review
*Goal: Ensure the editor feels like a professional tool, not a form.*
- Analyze `src/app/dashboard/reports/editor/[id]/page.tsx` (if exists) or current builder.
- Design the "Split View" layout: Editor (Left) vs. Evidence/Context Sidebar (Right).
- Define interactions for "Insert Evidence" and "AI Re-phrase".

### Phase 3: Wireframes & Component Spec
*Goal: Componentize the UI.*
- Spec out `ReportEditor` (Rich Text), `EvidenceSidebar`, `CitationCard`, `VersionHistory`.
- Define states: `Loading`, `Saving`, `Conflict`, `ReadOnly` (Finalized).
- Design the "Export/Download" modal with redaction options.

### Phase 4: AI Draft Editor Implementation
*Goal: The core writing experience.*
- Implement a Tiptap or similar Rich Text Editor.
- Connect "Generate Draft" button to `functions/src/ai/generateClinicalReport.ts`.
- Implement streaming response handling or robust loading states.
- Support "Section Regeneration" (e.g., "Re-write Summary only").

### Phase 5: Citations Sidebar & Evidence Insert
*Goal: Ground AI hallucinations with real data.*
- Build the Right Sidebar that queries `cases/{id}/evidence`.
- Drag-and-drop or "Click to Insert" functionality.
- Auto-link citations in text (e.g., `[Obs-01]`) to the evidence source.

### Phase 6: Sign-off, Versioning & Export
*Goal: Professional workflow.*
- Implement "Finalize Report" workflow: Locks editing, increments version, stamps `signedBy`.
- Generate PDF/DOCX (using `react-pdf` or server-side library).
- Archive previous versions (`reportVersions` subcollection).

### Phase 7: Redaction, Role-based Sharing & Consent
*Goal: Privacy & Safety.*
- Implement "Redaction Mode": Highlight text to mask in "Public/Parent" export.
- Permission checks: Parents see "Redacted" version, Clinicians see "Full".
- Verification of Consent before export (if applicable).

### Phase 8: Tests, QA, Monitoring & Rollout
*Goal: Production Readiness.*
- Unit tests for Schema validation and AI prompt builders.
- E2E test for "Draft -> Edit -> Finalize" flow.
- Monitor `ai_provenance` for hallucination rates or failures.
- Feature Flag rollout to pilot districts.

---

## 3. Existing Files to Inspect
*Backend / AI:*
- `functions/src/ai/generateClinicalReport.ts` (Core logic to upgrade)
- `src/ai/flows/generate-consultation-report.ts` (Client-side mirror/types)
- `src/ai/utils/prompt-builder.ts` (Ensure rigid prompt structure)
- `src/ai/utils/glossarySafeApply.ts` (Terminology enforcement)

*Frontend / UI:*
- `src/app/dashboard/reports/editor/[id]/page.tsx` (The main canvas)
- `src/components/dashboard/report-generator.tsx` (Current implementation)
- `src/components/cases/CaseDetail.tsx` (Source of data)
- `src/types/schema.ts` (Needs Type updates)

---

## 4. Proposed Firestore Schema

**Collection:** `tenants/{tenantId}/reports/{reportId}`

```typescript
interface Report {
  id: string;
  caseId: string;
  studentId: string;
  title: string; // e.g. "Psychological Assessment 2024"
  type: "consultation" | "statutory" | "ehcp_review";
  status: "draft" | "review" | "finalized" | "archived";
  
  // Content
  content: {
    // Structured for flexibility (or HTML string if using Tiptap)
    sections: {
      id: string;
      title: string; // "Background", "Observations"
      body: string;  // HTML/Markdown
      lastAiGeneratedAt?: Timestamp;
    }[];
  };

  // Metadata
  version: number; // Increment on finalize
  createdBy: string; // userId
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Sign-off
  signedBy?: string; // userId
  signedAt?: Timestamp;
  signatureUrl?: string; // Image path

  // AI & Provenance
  aiProvenanceId?: string; // Link to ai_provenance collection
  aiModel?: string;

  // Search/Filter
  tags: string[];
}
```

**Subcollection:** `tenants/{tenantId}/reports/{reportId}/versions/{versionId}`
*Immutable snapshot of a finalized report.*
```typescript
interface ReportVersion {
  versionNumber: number;
  content: Report['content'];
  snapshotDate: Timestamp;
  signedBy: string;
  // If we support redaction variants:
  redactionLevel?: "none" | "parent_safe" | "anonymized";
}
```

**Evidence Linking (in text)**
*Conventions within the `body` string:*
- `<span data-citation="ev-123">[Evidence: Classroom Obs]</span>`

---

## 5. Acceptance Criteria & Test Matrix

| Feature | Acceptance Criteria | Test Level |
| :--- | :--- | :--- |
| **Draft Gen** | User clicks "Generate", receives structured draft in <10s. Provenance logged. | Integration (Emulator) |
| **Editing** | User can edit text, save, and reload without data loss. | E2E (Playwright) |
| **Evidence** | Sidebar lists Case Evidence. Clicking inserts formatted citation tag. | E2E |
| **Glossary** | "Student" is auto-replaced with "Learner" (or tenant pref) in AI output. | Unit (Logic) |
| **Finalize** | Clicking "Finalize" locks the doc, creates Version 1, updates Status. | Integration |
| **Security** | "Parent" role cannot access "Draft" status reports, only "Finalized". | Security Rules Unit |

---

## 6. Rollout Plan

1.  **Feature Flag:** `ENABLE_REPORT_V2_EDITOR` (boolean).
2.  **Pilot:** Deploy to internal "Demo Tenant" first.
3.  **Beta:** Enable for "Lead Clinicians" group in 1 partner district.
4.  **General Availability:** Enable for all EPPs.
5.  **Migration:** Script to convert any legacy "text-blob" reports to new `sections` format (if necessary).

---
Stage 0 complete. Ready for Stage 1 prompt.
