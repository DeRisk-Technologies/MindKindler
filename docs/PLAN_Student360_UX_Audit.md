# Student 360 UX Audit Plan

## 1. Objective
Transform the "Student 360" profile into the primary daily anchor for Educational Psychologists (EPPs). The interface must prioritize:
*   **Actionability**: Immediate access to active interventions, pending assessments, and recent alerts.
*   **Trust**: Clear provenance for AI insights, visible consent status, and safeguarding flags.
*   **Speed**: <100ms interaction time for key navigation.
*   **Offline**: Full read/write capability for field work in low-bandwidth areas.

## 2. Execution Phases & Acceptance Criteria

### Phase 1: Audit & Gap Analysis
*   **Deliverables**: Report identifying performance bottlenecks, missing data connections (e.g. are assessments linked?), and accessibility violations.
*   **Criteria**: All current features mapped; offline failures identified.

### Phase 2: UX Review & Wireframes
*   **Deliverables**: Revised layout for `students/[id]` prioritizing "Clinical Dashboard" view over generic list view.
*   **Criteria**: Wireframes approved; includes "Action Items" widget and "Timeline" view.

### Phase 3: Implementation (Core Layout)
*   **Deliverables**: Refactored `students/[id]/page.tsx` using a modular grid layout.
*   **Criteria**: Page loads skeleton instantly; modular components fetch data independently.

### Phase 4: Integration (Data & AI)
*   **Deliverables**: Connect `InterventionPlan`, `AssessmentResult`, and `Case` data. Inject AI summary of recent activity.
*   **Criteria**: AI Summary uses Phase 6A localization/glossary; provenance links to source docs.

### Phase 5: Accessibility & Localization
*   **Deliverables**: ARIA labels, keyboard navigation, and i18n wrapping for all new components.
*   **Criteria**: Lighthouse Accessibility score > 95; translations verified for fr-FR/es-ES.

### Phase 6: Tests & Hardening
*   **Deliverables**: Unit tests for profile logic; Integration tests for offline sync.
*   **Criteria**: Jest coverage > 80% for student modules; deterministic rendering confirmed.

### Phase 7: Release
*   **Deliverables**: Deployment to production; feature flag enablement.
*   **Criteria**: Zero critical regressions; telemetry active.

## 3. Code Map
Files to audit and update:
*   `src/types/schema.ts` (Ensure `Student` includes `needs`, `history`, `activeCases`).
*   `src/app/dashboard/students/page.tsx` (Directory view).
*   `src/app/dashboard/students/[id]/page.tsx` (The 360 Profile).
*   `src/components/dashboard/students/consent-tab.tsx` (Privacy & Governance).
*   `src/components/dashboard/students/intervention-list.tsx` (Active Work).
*   `src/app/dashboard/students/[id]/interventions/page.tsx` (Detailed planning).
*   `src/app/dashboard/cases/page.tsx` (Cross-reference check).

## 4. Post-Release Metrics
*   **Time on Page**: Average session duration on Student Profile (expect increase).
*   **Action Conversion**: % of profile visits leading to a Case update or Assessment creation.
*   **Offline writes**: Number of updates queued/synced from offline mode.
*   **Load Time**: Time to Interactive (TTI) for the profile page.

## 5. Schedule (2 Weeks)
*   **Days 1-2**: Audit, Wireframes, Schema Updates.
*   **Days 3-5**: Core Layout Implementation (Grid, Widgets).
*   **Days 6-7**: Integration (AI Summaries, Assessments Linkage).
*   **Day 8**: Accessibility & Localization pass.
*   **Day 9**: Testing & Bug Fixes.
*   **Day 10**: Release & Monitoring Setup.

Stage 0 complete. Ready for Stage 1 prompt.
