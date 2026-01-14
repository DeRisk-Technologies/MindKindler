# MindKindler: State of the Union (Architecture & Product Status)

**Date:** January 2026
**Version:** 1.0 (Enterprise Release Candidate)

## 1. Executive Summary
MindKindler has evolved from a single-tenant pilot into a **Multi-Tenant, Multi-Region Clinical Operating System**. It is designed to serve the full spectrum of the Special Educational Needs (SEN) ecosystem: from freelance EPPs to entire Local Authorities and National Governments.

The platform solves the "Data Fragmentation" crisis by unifying:
1.  **Clinical Practice**: Casework, Assessments, and Reporting.
2.  **Governance**: Statutory Compliance and Data Sovereignty.
3.  **Professional Development**: AI-driven training and certification.

## 2. Core Engines

### 2.1 The Observation Cockpit (Mobile)
*   **Purpose**: Real-time behavioral data capture in classrooms.
*   **Tech**: React Mobile Web (PWA) with offline-first capability.
*   **Flow**: User selects a student -> Taps behavioral tiles (e.g., "On Task", "Disrupt") -> Data syncs to `assessment_results` -> Injected into AI Reports.

### 2.2 The Statutory Report Writer (GenAI)
*   **Purpose**: Reducing report writing time by 60% while improving consistency.
*   **Tech**: Google Vertex AI (Gemini 2.5 Flash) + TipTap Rich Text Editor.
*   **Logic**:
    *   **Context Injection**: Fetches Consultation Transcripts, Observation Logs, and WISC-V scores.
    *   **Safety**: PII Redaction layer prevents data leaks to the LLM.
    *   **Formatting**: Generates structured HTML (Section A, B, F) aligned with the UK SEND Code of Practice.

### 2.3 The "Gap Scanner" (Training AI)
*   **Purpose**: Automated Quality Assurance and CPD.
*   **Logic**: Compares AI Drafts vs. Final Reports using Levenshtein Distance. If an EPP consistently rewrites specific sections (e.g., "Cognition"), the system flags a knowledge gap and assigns a personalized "Micro-Course".

## 3. Enterprise Architecture

### 3.1 Data Sovereignty (The Sharded Data Plane)
To comply with strict data residency laws (GDPR, HIPAA), we utilize a **Multi-Region Architecture**:
*   **Global Control Plane**: Handles Authentication (`users`), Routing (`user_routing`), and Billing (`tenants`).
*   **Regional Data Planes**: Customer data resides strictly in region-specific Firestore instances:
    *   `mindkindler-uk` (London)
    *   `mindkindler-us` (Iowa)
    *   `mindkindler-eu` (Frankfurt)
*   **Enforcement**: The `ReportService` and `StudentService` dynamically resolve the database connection based on the user's `region` claim.

### 3.2 District Command Center (Analytics)
*   **Audience**: Directors of Education / Heads of Service.
*   **Capabilities**:
    *   **SLA Tracking**: Real-time view of statutory compliance (20-week deadline).
    *   **Heatmaps**: Visualizing high-referral schools.
    *   **Cost Forecasting**: AI projection of High Needs Block spend based on recommended provisions.

### 3.3 White-Labeling Engine
*   **Capability**: Tenants can brand the experience.
*   **Implementation**: `TenantConfig` stores logo, primary color, and header text. The `docx-generator` injects these assets into the headers/footers of exported reports.

## 4. Monetization & Business Model

### 4.1 Subscription Tiers (SaaS)
*   **Free**: Limited usage (5 reports/mo).
*   **Pro**: Increased limits (50 reports/mo).
*   **Enterprise**: Unlimited usage, SSO, White-labeling.
*   **Enforcement**: The `checkAndIncrementUsage` function is a "Gatekeeper" that runs before any high-cost API call.

### 4.2 The Marketplace
*   **Model**: App Store for Clinical Content.
*   **Items**: Country Packs (UK, US), Specialist Frameworks (Autism ADOS-2), Workflows.
*   **Payment Gate**: Integration with Stripe ensures premium packs cannot be installed without a valid purchase record.

## 5. Next Horizon
*   **GovIntel**: National-level benchmarking.
*   **Offline App**: Native iOS/Android wrapper for low-connectivity zones.
*   **Federated Learning**: Training the Clinical AI on aggregated, anonymized insights across tenants.
