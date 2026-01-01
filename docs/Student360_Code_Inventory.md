# Student 360 Code Inventory & Analysis

## 1. Overview
The **Student 360** module is the central clinical hub for managing student profiles, interventions, and assessments. This inventory maps all identified code artifacts, data models, and risks associated with this domain.

## 2. File Inventory

| File Path | Description |
| :--- | :--- |
| `src/app/dashboard/students/page.tsx` | Main directory view listing all students with search/filter. |
| `src/app/dashboard/students/[id]/page.tsx` | The core "Student 360" profile page (Timeline, Overview, Actions). |
| `src/app/dashboard/students/[id]/interventions/page.tsx` | Detailed list of active and past intervention plans. |
| `src/app/dashboard/students/[id]/interventions/[planId]/page.tsx` | Editor/View for a specific intervention plan. |
| `src/components/dashboard/students/consent-tab.tsx` | Component managing GDPR/Consent status toggles. |
| `src/components/dashboard/students/intervention-list.tsx` | Reusable list widget for displaying interventions on the profile. |
| `src/types/schema.ts` | TypeScript interfaces for `Student`, `AssessmentAssignment`, `Case`. |
| `src/app/dashboard/cases/page.tsx` | Case management view (heavily cross-referenced with Student ID). |
| `src/app/dashboard/consultations/[id]/page.tsx` | Live consultation view (reads/writes to student history). |

## 3. Data Model References (Firestore)

| Collection | Key Fields | Usage |
| :--- | :--- | :--- |
| **`students`** | `firstName`, `lastName`, `dob`, `needs`, `tenantId` | Core profile data. |
| **`cases`** | `studentId`, `status`, `severity`, `title` | Linking clinical incidents to the student. |
| **`interventions`** | `studentId`, `type`, `status`, `progress` | Tracking specific support plans. |
| **`assessments`** | `studentId`, `templateId`, `score` | Educational testing results. |
| **`consents`** | `studentId`, `scope`, `status`, `expiresAt` | managing legal permissions (Audit gap: strict enforcement?). |

## 4. Technical Analysis of Key Flows

### A. Student Profile Load (`students/[id]/page.tsx`)
- **Read:** Fetches `students/{id}` document.
- **Read:** Fetches related sub-collections or queries (`cases`, `interventions`) filtering by `studentId`.
- **Risk:** Currently appears to load data in parallel without strict "Consent Check" blocking the view if consent is revoked.
- **Sync:** Uses `onSnapshot` (via hooks) for real-time updates, which is good for collaboration but heavy on reads.

### B. Consultation & Evidence (`consultations/[id]/page.tsx`)
- **Read:** Loads student context to prime the AI.
- **Write:** Saves transcript chunks and generated reports.
- **Risk:** Evidence gathered here is not automatically "structured" into the Student 360 timeline; it remains locked in the consultation session doc unless manually transferred to a Case.

### C. Intervention Planning
- **Write:** Creates new `interventions` docs.
- **Gap:** No obvious link to "Evidence Base" (e.g., "Why did we choose this intervention?").

## 5. Gaps & Risks

1.  **Consent Enforcement:** While `consent-tab.tsx` exists, it's unclear if the *backend* enforces these flags. A revoked consent should physically block access to the 360 view or hide sensitive fields.
2.  **Audit Logs:** Viewing a student profile (Read Event) does not appear to generate an audit log entry. This is a compliance gap for HIPAA/GDPR.
3.  **Attachments:** No dedicated `documents` or `attachments` view found in the inventory scan. Large files (PDF reports) might be missing a streaming/preview strategy.
4.  **Performance:** The profile page likely fetches all history at once. Needs pagination for students with years of history.
5.  **Offline:** No explicit offline-sync logic found beyond default Firestore SDK caching. "Field Mode" needs explicit `localStorage` or Service Worker strategies for robustness.

Stage 1 complete. Ready for Stage 2 prompt.
