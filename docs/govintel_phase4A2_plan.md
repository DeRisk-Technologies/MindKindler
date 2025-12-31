# Government Intelligence Phase 4A-2 Plan: Policy Co-Pilot

## Objective
Implement a **Policy Co-Pilot** that generates narrative insights, policy briefings, and recommended actions for government officials. This module synthesizes aggregated data from `govSnapshots` with verified evidence from the `KnowledgeVault` to produce citation-backed, privacy-safe outputs.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **GovMemo (New):**
    - `id`, `tenantId`, `scopeType`, `scopeId`
    - `period`: string
    - `memoType`: 'briefing' | 'policy' | 'training' | 'safeguarding'
    - `contentHtml`: string
    - `citations`: KnowledgeChunk[] (copied for snapshot stability)
    - `confidence`: 'high' | 'medium' | 'low'
    - `status`: 'draft' | 'final'
- [ ] **GovAction (New):**
    - `id`, `title`, `category`, `status`, `ownerUserId`
    - `linkedMemoId`

## 2. Co-Pilot Engine
**Path:** `src/govintel/copilot.ts` (New)

- [ ] **`generateNarrative(snapshot, context)`**:
    - Analyzes snapshot metrics (e.g., "Critical Safeguarding Incidents > 10").
    - Selects a template based on `memoType`.
    - **Retrieval:** Calls `retrieveContext` using keywords from the snapshot issues (e.g., "safeguarding policy", "intervention strategies").
    - **Synthesis:** Combines metrics + template + evidence citations into HTML.
    - **Confidence:** Calculates score based on data volume (suppressed counts lower confidence).

## 3. Policy Co-Pilot UI
**Path:** `src/app/dashboard/govintel/copilot/page.tsx`

- [ ] **Input Form:**
    - Scope Selector (Council/State).
    - Period Selector.
    - Memo Type Selector.
    - "Generate Draft" button.
- [ ] **Output View:**
    - Rich Text Editor (or Textarea) for the generated content.
    - **Citations Panel:** Reuses `Citations` component to show sources.
    - **Actions:** "Save Memo", "Export PDF".
- [ ] **Action Tracker:** Minimal list of `GovAction` items linked to this session.

## 4. Integration
- [ ] **Dashboard Hooks:** Add "Draft Briefing" button to `GovOverviewPage` (`src/app/dashboard/govintel/overview/page.tsx`).

## 5. Execution Steps
1.  **Schema**: Define `GovMemo` and `GovAction`.
2.  **Engine**: Build the narrative generator logic.
3.  **UI**: Build the Co-Pilot page.
4.  **Integration**: Link from Overview dashboard.
5.  **Actions**: Implement simple Action Tracker.

## Manual Test Checklist
- [ ] **Generate**: Go to Co-Pilot. Select "Council" and "Briefing". Click Generate.
- [ ] **Verify Content**: Check that the text references metrics (e.g., "12 incidents") AND includes citations to rulebooks/evidence.
- [ ] **Save**: Save the memo.
- [ ] **Action**: Click "Create Action" from the UI. Verify it appears in the list.
- [ ] **Launch**: Go to Gov Overview. Click "Draft Briefing" and verify it redirects to Co-Pilot with pre-filled scope.
