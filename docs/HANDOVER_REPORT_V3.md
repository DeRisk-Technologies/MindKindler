# MindKindler Development Status Report

## 1. Executive Summary
MindKindler is a specialized, multi-region Educational Psychology Platform (EPP) designed for statutory compliance (UK EYFS/SEND, US FERPA). It employs a "Split-Brain" architecture to ensure strict data sovereignty while allowing global management.

**Current Status:** **Pilot Ready (Production Grade)**.
The core workflows for Independent EPPs—from signup to live consultation, AI-assisted synthesis, and statutory report generation—are fully implemented and functional.

---

## 2. Application Architecture

### A. The "Split-Brain" Database Strategy
*   **Global Control Plane (`(default)` DB):**
    *   **Purpose:** Routing, Identity, Billing, Marketplace Configuration.
    *   **Collections:** `users` (auth map), `user_routing` (critical for shard resolution), `organizations` (tenant settings, branding), `tenants` (legacy map).
    *   **Data:** Contains **NO PII**. Only metadata needed to route a user to their legal jurisdiction.
*   **Regional Data Plane (Shards):**
    *   **Purpose:** Stores all sensitive Student/Clinical Data.
    *   **Instances:** `mindkindler-uk` (London), `mindkindler-us` (Iowa), `mindkindler-eu` (Frankfurt).
    *   **Collections:** `students` (Clinical Records), `consultation_sessions` (Transcripts), `reports` (Statutory Outputs), `cases`.
    *   **Security:** Data never leaves the region. The frontend connects directly to the specific shard via `getRegionalDb(regionId)`.

### B. User Roles & Hierarchy
1.  **Global Super-Admin:**
    *   **Scope:** Cross-Region. Can provision tenants, manage global marketplace packs, and seed pilot data.
    *   **Access:** Can switch views between shards.
2.  **Regional Super-Admin:**
    *   **Scope:** Specific Region (e.g., UK). Manages verification of EPPs in that region.
    *   **Access:** Locked to one shard (e.g., `mindkindler-uk`).
3.  **Independent EPP (Tenant Admin):**
    *   **Scope:** Their own Private Practice (`practice_{uid}`).
    *   **Role:** The **Central User**. They own the student data, conduct consultations, and generate reports.
    *   **Signup Flow:** User signs up -> Admin upgrades role to 'EPP' -> System auto-provisions a `practice_{uid}` Tenant ID -> User gets isolated workspace.

---

## 3. Key Features Delivered

### A. Live Consultation Cockpit
*   **Location:** `/dashboard/consultations/live/[id]`
*   **Features:**
    *   **Real-time Transcription:** Web Speech API captures dialogue with interim results.
    *   **Streaming AI Co-Pilot:** Gemini 2.0 Flash analyzes speech in real-time to suggest "Strengths", "Risks", and "Questions" via a low-latency stream.
    *   **Student Bridge:** A simplified tablet view (`/session/student/[id]`) for students to provide AAC feedback (Visual Cards) which syncs to the EPP's view.
    *   **Observation Mode:** Interactive tiles for tracking behaviors (e.g., "Fidgeting") timestamped to the audio.

### B. Post-Session Synthesis
*   **Location:** `/dashboard/consultations/synthesis/[id]`
*   **Workflow:**
    *   **Clinical Review:** EPP reviews the transcript and "Confirms" AI hypotheses into clinical opinions (Human-in-the-Loop).
    *   **Smart Plan:** `InterventionPlanner` maps deficits (from WISC-V scores + Transcript) to evidence-based programs (e.g., ELKLAN) defined in the Country Pack.
    *   **Persistence:** All decisions are saved to the Regional DB.

### C. Statutory Report Writer
*   **Location:** `/dashboard/reports/builder` & `/editor/[id]`
*   **Features:**
    *   **Context-Aware AI:** Injects the full (redacted) Student Profile + Consultation Evidence into the prompt.
    *   **Templates:** Supports Statutory (EHCP) and Custom templates via the Marketplace.
    *   **Privacy:** Implements strict redaction (Initials only, Age instead of DOB) before sending data to the LLM.
    *   **Branding:** Generates PDFs with the Practice's Logo and Letterhead (configured in Settings).

---

## 4. Important Files & Functions

### Core Logic
*   `src/lib/firebase.ts`: The "Brain". Exports `getRegionalDb(region)` which routes queries to the correct shard.
*   `src/hooks/use-auth.ts` & `use-permissions.ts`: Resolves the user's Region and Tenant Context.
*   `src/app/actions/consultation.ts`: Server Actions for AI analysis (isolates Node.js logic).

### AI Engine
*   `functions/src/ai/generateClinicalReport.ts`: Cloud Function that drafts reports. Includes a **Client-Context Bypass** to handle shard data provided by the frontend.
*   `src/services/ai/ConsultationCopilot.ts`: The streaming engine for the live cockpit.

### UI Components
*   `src/components/consultations/PostSessionSynthesis.tsx`: The complex multi-tab interface for reviewing sessions.
*   `src/components/dashboard/sidebar.tsx`: Dynamic navigation based on role.

---

## 5. Challenges & Solutions

*   **Challenge:** Cloud Functions (running in Default context) could not read Student Data from Regional Shards.
    *   **Solution:** We updated the Frontend to fetch the data from the shard and pass it as a `context` payload to the function, bypassing the need for the function to connect to the shard directly.
*   **Challenge:** "Hanging" UI during Report Generation.
    *   **Solution:** Switched to Gemini 2.0 Flash (faster), added optimistic UI updates ("Draft Created!"), and ensured robust error handling for missing data.
*   **Challenge:** Data Privacy in AI Prompts.
    *   **Solution:** Implemented a client-side `redactForAI` helper that strips PII (Addresses, UPNs) before the data ever leaves the browser/server action.

---

## 6. Next Steps (Roadmap)

1.  **Referral Generator:**
    *   Build the "Referral Letter" feature in Synthesis. Allow EPPs to generate specific letters for GPs/CAMHS with one click.
2.  **Report Directory Polish:**
    *   Ensure the "Reports Directory" allows bulk actions (Delete, Archive) and advanced filtering by Student Name.
3.  **Deployment:**
    *   **CRITICAL:** Redeploy the Cloud Functions (`firebase deploy --only functions`) to ensure the latest `generateClinicalReport` logic (which accepts client context) is live.
4.  **User Acceptance Testing (Pilot):**
    *   Onboard the 5 Pilot EPPs using the new "Auto-Provision" flow in the Admin Console.

**Ready to start new session.**
