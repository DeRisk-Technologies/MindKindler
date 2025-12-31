# Governance Phase 3C-1 Plan: Automatic Rule Extraction

## Objective
Implement an automated pipeline to extract draft Policy Rules from uploaded Rulebooks. This allows Admins to rapidly build a compliance baseline by reviewing and publishing AI-suggested rules instead of creating them manually.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **PolicyRuleDraft (New):**
    - `id`, `tenantId`, `sourceDocumentId`
    - `structuredDraft`: Partial<PolicyRule> (title, severity, mode, etc.)
    - `extractedText`: string (The raw text snippet)
    - `citations`: string[] (Chunk IDs)
    - `status`: 'draft' | 'approved' | 'rejected'
    - `confidence`: number
- [ ] **PolicyRule (Update):**
    - `sourceDraftId`: string
    - `version`: number
    - `previousRuleId`: string

## 2. Extraction Pipeline
**Path:** `src/ai/knowledge/ingest.ts` (Upgrade)

- [ ] **Trigger:** After `ingestDocument` completes.
- [ ] **Logic:**
    - Iterate chunks.
    - Run `extractRulesFromChunk(text)` (Mock AI for now).
    - Heuristic: If text contains "must", "shall", "prohibited" -> Create Draft.
    - Save to `policyRuleDrafts`.
- [ ] **Status:** Update `knowledgeDocument` with `extractionStatus: 'complete'`.

## 3. Review UI (Rule Drafts)
**Path:** `src/app/dashboard/intelligence/rule-drafts`

- [ ] **List Page (`/page.tsx`):**
    - Filter by Rulebook Source.
    - Filter by Confidence/Status.
- [ ] **Detail Page (`/[id]/page.tsx`):**
    - **Left Col:** Extracted Text + Citation context.
    - **Right Col:** Form to edit Title, Severity, Mode, Triggers.
    - **Actions:** Approve (Create Rule), Reject (Update Status).

## 4. Publishing Flow
- [ ] **Approval:**
    - Create `policyRule` document.
    - Copy metadata (Source Doc ID, Draft ID).
    - Set default mode: `advisory` (Safety first).
    - Update `policyRuleDraft` status to `approved`.

## 5. Execution Steps
1.  **Schema**: Update types.
2.  **Pipeline**: Add extraction logic to `ingest.ts`.
3.  **UI**: Build Draft List and Detail pages.
4.  **Nav**: Add "Rule Drafts" to Intelligence Hub.
5.  **Integration**: Ensure approving a draft spawns a real rule visible in Policy Manager.

## Manual Test Checklist
- [ ] **Upload**: Upload a dummy Rulebook (text with "must" and "shall").
- [ ] **Verify Drafts**: Go to Rule Drafts list. See generated drafts.
- [ ] **Review**: Open a draft. Edit title.
- [ ] **Approve**: Click Approve.
- [ ] **Verify Rule**: Go to Policy Manager. See the new rule active.
