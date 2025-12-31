# Government Intelligence Phase 4A-1 Plan

## Objective
Build **Government & Council Intelligence Dashboards** to provide aggregated, anonymized insights into education outcomes, safeguarding, and compliance across schools, councils, and states.

## 1. Data Model Strategy
**Collections:**
- `govSnapshots`: Pre-computed daily/monthly aggregates.
    - `id`: `type_scopeId_period` (e.g., `council_c123_2023-10`).
    - `scopeType`: 'council' | 'state' | 'federal'.
    - `scopeId`: string.
    - `period`: string (YYYY-MM).
    - `metrics`: JSON object containing all aggregated counts.
    - `createdAt`: timestamp.
- `govReports`: Generated PDF/HTML reports.
    - `id`, `tenantId`, `scopeType`, `scopeId`, `period`, `contentHtml`.

**Anonymization Rules:**
- Any metric count < 5 is replaced with `-1` (sentinel for "suppressed") in the UI or backend before display.
- No PII (names, specific dates of birth) in snapshots.

## 2. Aggregation Engine
**Path:** `src/analytics/govSnapshots.ts`

- **Function:** `generateSnapshot(scopeType, scopeId)`
- **Sources:**
    - `assessments`: Count total, avg score.
    - `interventionPlans`: Count active, % improving.
    - `safeguardingIncidents`: Count by severity.
    - `guardianFindings`: Count critical issues.
    - `trainingCompletions`: Count CPD hours.
- **Logic:** Fetch all documents matching the scope (mock filter for now), compute averages/sums, apply suppression if needed (or apply at view time).

## 3. UI Structure (`src/app/dashboard/govintel/...`)
- **Overview (`/overview`)**: High-level KPIs (Total Assessments, Critical Risks, Training Health). Map/List of sub-entities.
- **Hotspots (`/hotspots`)**: Ranked list of schools/councils with "Worsening Outcomes" or "High Risk".
- **Outcomes (`/outcomes`)**: "What Works" analytics (Intervention impact at scale).
- **Safeguarding (`/safeguarding`)**: Incident trends (Heatmap style).
- **Training (`/training`)**: Capacity building metrics.
- **Reports (`/reports`)**: Archive of generated monthly reports.

## 4. Execution Steps
1.  **Analytics**: Implement `src/analytics/govSnapshots.ts`.
2.  **Overview UI**: Build the main dashboard with scope selection (Council/State/Federal).
3.  **Sub-Dashboards**: Implement Hotspots, Outcomes, Safeguarding, Training pages.
4.  **Reports**: Implement Report Generator.
5.  **Integration**: Add manual "Run Snapshot" trigger for testing.

## Manual Test Checklist
- [ ] **Generate Data**: Ensure some assessments and incidents exist.
- [ ] **Run Snapshot**: Click "Run Snapshot Now" (Admin tool).
- [ ] **Verify Overview**: Check Overview page. Confirm numbers match (or are suppressed if < 5).
- [ ] **Check Hotspots**: Verify schools appear in the hotspots list based on negative metrics.
- [ ] **Export**: Generate a report and verify it renders.
