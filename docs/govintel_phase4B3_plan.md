# Government Intelligence Phase 4B-3 Plan: Benchmarking & Cross-Region Comparisons

## Objective
Implement **Benchmarking Scorecards** and **Cross-Region Comparisons** using aggregated data to provide government officials with high-level insights into performance, compliance, and outcomes across different councils and states.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **BenchmarkSnapshot (New):**
    - `id`, `tenantId`, `period` (YYYY-MM)
    - `scopeType`: 'councilComparison' | 'stateComparison'
    - `parentScopeId`: string (State ID or Federal ID)
    - `units`: Array of:
        - `unitId`, `unitName`
        - `scores`: { overall, outcomes, safeguarding, compliance, training, capacity }
        - `subScores`: Record<string, number>
        - `suppressedFlags`: string[] (list of metrics hidden due to <5 count)
    - `createdAt`: timestamp

## 2. Benchmarking Engine
**Path:** `src/govintel/benchmarking/scorecard.ts` (New)

- [ ] **`generateBenchmark(scopeType, parentId)`**:
    - Fetches all `govSnapshots` for the child units within the parent scope.
    - **Normalization**: Scales raw metrics (e.g., "Improving %") to 0-100 scores.
    - **Weighting**: Applies weights (Outcomes 35%, Safeguarding 20%, etc.) to compute Overall Score.
    - **Outlier Detection**: Flags units in top/bottom 10% percentile.

**Path:** `src/govintel/benchmarking/whatWorks.ts` (New)

- [ ] **`analyzeWhatWorks(units[])`**:
    - Correlates "High Outcome Score" units with their "Top Interventions".
    - Returns list of "High Impact" recommendation templates.

## 3. UI Implementation
**Path:** `src/app/dashboard/govintel/benchmarking` (New Module)

- [ ] **Comparison Page (`/page.tsx`)**:
    - Filters: Scope (Council/State), Period.
    - **Ranking Table**: List units sorted by Overall Score.
    - **Visuals**: Bar charts comparing scores across 5 domains.
- [ ] **Unit Detail (`/[unitId]/page.tsx`)**:
    - Spider/Radar chart of the 5 domains.
    - "What Works" section showing top interventions for this unit.
- [ ] **National Scorecard (`/scorecards/page.tsx`)**:
    - High-level federal view.

## 4. Integrations
- [ ] **Policy Co-Pilot**: Add "Draft Benchmarking Brief" action that sends benchmark data to the narrative generator.
- [ ] **Procurement**: Update Generator to optionally include benchmark stats.

## 5. Execution Steps
1.  **Schema**: Add Benchmark types.
2.  **Engine**: Implement Scoring & What-Works logic.
3.  **UI**: Build Comparison & Detail pages.
4.  **Integration**: Connect to Policy Co-Pilot.

## Manual Test Checklist
- [ ] **Generate Data**: Ensure multiple `govSnapshots` exist (simulate 2 councils).
- [ ] **Run Benchmark**: Go to Benchmarking Dashboard. Click "Run Benchmark".
- [ ] **Verify Ranking**: Check that units are listed and scores are calculated (0-100).
- [ ] **Check Suppression**: Ensure small counts show as "—".
- [ ] **Co-Pilot**: Click "Draft Brief". Verify the generated text mentions the top-ranking council.
