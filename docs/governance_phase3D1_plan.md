# Governance Phase 3D-1 Plan: Evidence Engine

## Objective
Establish the **Evidence Vault** to store verified research, guidelines, and reference materials. Enhance the Knowledge Retrieval system to prioritize "Verified" and "High Trust" documents, and create a unified **Citations UI** to transparently display sources in all AI-generated content.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **KnowledgeDocument (Update):**
    - `type` can now be `'evidence'`.
    - `metadata` extended: `authors`, `publicationYear`, `publisher`, `evidenceType`, `doiOrUrl`, `trustScore` (0-100), `verified` (boolean), `jurisdiction`.
- [ ] **UserProfile (Update):**
    - `isEvidenceCurator`: boolean (Role flag).

## 2. Evidence Vault UI
**Path:** `src/app/dashboard/intelligence/evidence/page.tsx`

- [ ] **List View:**
    - Filter by Verified / Unverified.
    - Display Trust Score badges (Green 80+, Yellow 50+, Red <50).
    - Filter by Jurisdiction (e.g. UK, US, Global).
- [ ] **Upload Integration:**
    - Reuse `DocumentUploadDialog` but add "Evidence" mode which asks for extra metadata (Type, Year, Source).

## 3. Retrieval Engine Upgrade
**Path:** `src/ai/knowledge/retrieve.ts`

- [ ] **Logic Update:**
    - `retrieveContext` accepts `filters: { verifiedOnly, minTrustScore, jurisdiction }`.
    - If `verifiedOnly` is true, filter chunks where parent doc `verified === true`.
    - Mock ranking boost: If `trustScore > 80`, artificially boost score or sort order.

## 4. Components: Unified Citations
**Path:** `src/components/ui/citations.tsx` (New)

- [ ] **Props:** `citations: KnowledgeChunk[]`.
- [ ] **UI:**
    - List of sources.
    - "Verified" badge (Shield Check icon).
    - "Trust Score" bar.
    - Click to expand snippet.

## 5. Integration: Assessment Summary
**Path:** `src/app/dashboard/assessments/results/[id]/page.tsx`

- [ ] Add "Enhance with Evidence" button below the AI Summary.
- [ ] **Action:**
    - Call `retrieveContext` with summary keywords + `verifiedOnly=true`.
    - Append "Evidence References" section to the summary text.
    - Render `Citations` component below the text area.

## 6. Execution Steps
1.  **Schema**: Update types.
2.  **Upload UI**: Update `DocumentUploadDialog` to handle Evidence metadata.
3.  **Vault UI**: Build the Evidence Vault page.
4.  **Retrieval**: Update `retrieve.ts` with trust logic.
5.  **Component**: Build `citations.tsx`.
6.  **Integration**: Wire up "Enhance with Evidence" in Assessment Results.

## Manual Test Checklist
- [ ] **Upload**: Upload a "Clinical Guideline" to Evidence Vault. Set Trust Score = 90, Verified = True.
- [ ] **Query**: Go to "Ask the Vault". Search for keywords in that guideline. Verify the citation shows the "Verified" badge.
- [ ] **Assessment**: Go to an Assessment Result. Click "Enhance with Evidence". Verify citations appear.
