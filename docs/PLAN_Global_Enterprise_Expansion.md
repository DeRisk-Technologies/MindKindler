# MindKindler: Global Enterprise & GovIntel Expansion Plan

## 1. Executive Summary
This expansion transforms MindKindler from a single-tenant or simple multi-tenant app into a **Global Enterprise SaaS** capable of serving National Governments, State Boards, and large Private Education networks. It introduces strict data residency, hierarchical governance, and advanced commercial flows.

## 2. Core Architecture Upgrades

### 2.1 Hierarchical Data Model (The "Education Graph")
We will move beyond simple `Tenant -> User` to a robust graph:
*   **Global/Platform**: The MindKindler SuperAdmin.
*   **National/Country**: E.g., "Ministry of Education - UK".
*   **State/Region**: E.g., "California Dept of Education", "NSW Education".
*   **LEA/District**: E.g., "Los Angeles Unified", "Camden Council".
*   **School/Institution**: The unit of delivery.
*   **Service Provider (EPP/Agency)**: Freelancers or Agencies serving multiple LEAs/Schools.

### 2.2 Data Residency & Multi-Region Strategy
*   **Concept**: "Pods" or "Cells". A US-based LEA must have data stored in `us-central1`. A German school in `europe-west3`.
*   **Implementation**:
    *   **Router**: A global login service determines the user's home region.
    *   **Sharding**: Tenant configuration includes `region` and `firestoreDbId`.
    *   **Compliance**: `firestore.rules` and Cloud Functions will validate data never crosses region boundaries for PII.

## 3. Detailed Feature Specifications

### 3.1 Enterprise Administration
*   **New Roles**: `EnterpriseAdmin`, `OrgCEO`, `StateOfficial`.
*   **Capabilities**:
    *   Create/Manage subordinate organizations (State creates LEAs).
    *   Cascading Analytics: View aggregated stats from all child entities.
    *   Staff Directory: Global address book with role-based visibility.

### 3.2 Commercial & Onboarding
*   **Self-Service Portal**:
    *   Stripe Integration for Credit Card/Direct Debit.
    *   Plan Selection (Basic, Pro, Enterprise).
    *   Automated Invoice Generation.
*   **Compliance Onboarding**:
    *   Data Processing Agreement (DPA) e-signing.
    *   Region selection (enforcing GDPR/CCPA).

### 3.3 The "360" Views
*   **LEA 360**: Dashboard showing all connected schools, aggregate risk, budget, and EPP performance.
*   **Staff 360**: Detailed profiles for staff, including certifications, caseloads, and school assignments.

## 4. Implementation Stages

### Phase 1: Data Model & Hierarchy (Immediate)
*   Define `Organization`, `HierarchyNode`, `Subscription` types.
*   Update `User` profile to support multi-org affiliation (for Freelancers).
*   Create "Enterprise Console" UI.

### Phase 2: Commercial Infrastructure (Weeks 2-4)
*   Integrate Stripe Customer Portal.
*   Implement Subscription state management (Active, Past Due, Canceled).

### Phase 3: Data Residency Engine (Weeks 5-8)
*   Refactor Firebase init to support dynamic config loading based on Tenant ID.
*   Implement "Region Selector" during sign-up.

## 5. Security & Governance
*   **Guardian AI Upgrade**: Enforce PII rules based on the *Organization's* jurisdiction (e.g., stricter rules for Germany).
*   **Audit**: Cross-organization audit logs for State Admins.

---

**Authorized by**: MindKindler Engineering
**Status**: In Progress
