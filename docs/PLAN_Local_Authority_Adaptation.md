# Local Authority (LA) Adaptation Plan

**Date:** January 16, 2026
**Status:** Planned (Post-EPP Independent Workflow)
**Context:** Adapting MindKindler to serve Local Authorities (LEAs) as a management and commissioning platform, distinct from the forensic workstation used by Independent EPPs.

---

## 1. The Core Shift: From "Doing" to "Managing"

*   **The Independent EPP** uses MindKindler as a **Workstation**. They need forensic tools, deep analysis, and report writing.
*   **The LA (SEND Team)** uses MindKindler as a **Logistics Platform**. They need traffic control, compliance tracking, and commissioning.

---

## 2. Adaptation Strategy: The "LA Command Center"

We will leverage the existing **GovIntel** module (`src/app/dashboard/govintel`) and transform it into the LA's Operational Dashboard.

### A. Organizational Hierarchy (The "Big Tenant")
*   **Current Model:** `practice_{uid}` (Single EPP).
*   **LA Model:** `la_leeds` (Enterprise Tenant).
*   **New Hierarchy:**
    *   **Teams:** "Early Years Team", "North Area Team", "Post-16 Team".
    *   **Roles:** 
        *   `SEND_OFFICER` (Case Manager)
        *   `ADMIN` (Data Entry)
        *   `PANEL_MEMBER` (Decision Maker)
        *   `PRINCIPAL_EP` (Manager of internal EPPs)

### B. The "Fleet View" (Scaling the Case List)
The current `ActiveCaseList` is designed for ~20 cases. An LA has ~2,000 active cases.
*   **New Feature:** **"The Traffic Control Tower"**
    *   A high-density `DataTable` view grouping cases by **Statutory Stage** (Week 6, Week 12, Week 16).
    *   **Breach Radar:** "Show me all cases at Week 18 that don't have a Draft Plan."

### C. The Commissioning Engine (Connecting LA -> EPP)
*   **Concept:** Instead of sending Zip files, the LA **"Pushes"** the case to the EPP via the platform.
*   **Workflow:**
    1.  LA creates Case (Intake).
    2.  LA reaches Week 6 (Decision to Assess).
    3.  LA clicks **"Commission Advice"**.
    4.  LA selects "Internal EP Team" OR "External Agency (Independent EPP)".
    5.  **System Action:**
        *   Creates a **"Sub-Case"** or **"Contract"** in the EPP's tenant.
        *   Grants the EPP access to specific evidence (Parent View, Medical Report).
        *   Sets the **Contract Deadline**.
*   **Benefit:** The EPP logs in and finds the data pre-loaded. No forensic zip extraction required.

### D. The "Panel" Module
*   **New Feature:** **"Digital Panel Pack"**
    *   Replaces printed PDF packs for weekly decision panels.
    *   **AI Integration:** "Triangulation Engine" auto-generates the "Panel Summary" (Parent vs. School views).
    *   **Voting:** Panel members record decisions ("Agree to Assess" / "Refuse") directly in the system to update Case Status and Statutory Clock.

---

## 3. Implementation Roadmap

### Phase 1: The Enterprise Tenant (Infrastructure)
*   **Action:** Enhance `provisionTenant` script to support `type: 'local_authority'` (seeds departments/teams).
*   **Action:** Update `RouteGuard` to direct `SEND_OFFICER` roles to `/dashboard/govintel` (or a new `/dashboard/la`) instead of the standard clinical dashboard.

### Phase 2: The Commissioning Portal (The "Bridge")
*   **Action:** Create a "Marketplace" view for LAs to see available EPPs.
*   **Action:** Build the `assignCase` Cloud Function for secure cross-tenant data sharing (LA Tenant -> EPP Tenant).

### Phase 3: The 20-Week Enforcer (Compliance)
*   **Action:** Enhance `StatutoryTimeline` logic with **Active Alerts** (Email/SMS to Case Workers regarding deadlines).

---

## 4. Immediate "Low Hanging Fruit"

1.  **Dual Track Workflow:**
    *   LA users default to the **20-Week** view in `useStatutoryWorkflow`.
    *   EPP users remain on the **6-Week** view.

2.  **Report Template for LAs:**
    *   Create a "Draft EHCP" template (Section A-K).
    *   Use AI to "Summarize all attached advice into Section B".
