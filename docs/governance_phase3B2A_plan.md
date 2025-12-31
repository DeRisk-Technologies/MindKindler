# Governance Phase 3B-2A Plan: Consent & Privacy

## Objective
Implement a real **Consent Module** to replace mock data in Guardian checks. This involves creating a new `consents` collection, building UI for managing consents on student profiles, and upgrading the Guardian engine to fetch real consent status during assessment finalization.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **ConsentRecord (New):**
    - `id`: string
    - `tenantId`: string
    - `subjectType`: 'student' | 'parent'
    - `subjectId`: string
    - `consentType`: 'dataProcessing' | 'assessment' | 'teleconsultation' | 'mediaRecording'
    - `status`: 'granted' | 'revoked' | 'pending'
    - `grantedByUserId`: string
    - `grantedAt`: string
    - `revokedAt`?: string
    - `notes`?: string

## 2. UI Implementation
**Path:** `src/app/dashboard/students/[id]/page.tsx`

- [ ] Add **Consent & Privacy** tab.
- [ ] **Components:**
    - `ConsentList`: Table of active/inactive consents.
    - `AddConsentDialog`: Modal to record new consent (Type, Granted By, Notes).
    - `RevokeConsentButton`: Action to revoke existing consent.

**Path:** `src/app/dashboard/assessments/results/[id]/page.tsx`

- [ ] Add **ConsentIndicator**: Visual banner above "Finalize" button showing status of `dataProcessing` and `assessment` consents for the student.

## 3. Guardian Integration
**Path:** `src/ai/guardian/engine.ts`

- [ ] Update `evaluateEvent` for `assessment.finalize`.
- [ ] **Logic:** Fetch all `active` consents for `event.context.studentId`.
- [ ] **Context Injection:** Pass `{ consent: { assessment: boolean, dataProcessing: boolean } }` to trigger functions.

**Path:** `src/ai/guardian/triggers.ts`

- [ ] Update `checkConsent` to read from the injected real context instead of mock.

## 4. Execution Steps
1.  **Schema**: Update `src/types/schema.ts`.
2.  **UI**: Implement Consent tab in Student Profile.
3.  **UI**: Add indicator in Assessment Result page.
4.  **Engine**: Update Guardian `evaluateEvent` to fetch real Firestore data.
5.  **Audit**: Ensure creation/revocation is logged (console/toast for now).

## Manual Test Checklist
- [ ] **Add Consent**: Go to Student Profile > Consent tab. Add "Assessment" consent.
- [ ] **Verify Indicator**: Go to an Assessment Result for that student. See "Consent Granted".
- [ ] **Revoke**: Go back to Profile, revoke consent.
- [ ] **Verify Warning**: Go back to Assessment Result. See "Consent Missing".
- [ ] **Trigger Guardian**: Click Finalize. Verify Guardian Advisory modal appears correctly using real data.
