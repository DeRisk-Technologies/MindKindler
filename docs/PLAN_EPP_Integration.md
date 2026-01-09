# MindKindler EPP Workflow Integration Plan

## 1. Context & Objective
The key user of MindKindler is the **Educational Psychologist (EPP)**. Currently, critical features (`Consulting`, `Assessment`, `Community`, `Training`, `Intelligence`, `Partner`, `Data Ingestion`) are disconnected or hidden from the sidebar. 
The goal is to integrate these into a **"Closed Loop" Workflow** that mirrors the EPP's daily operations: 
*Intake -> Assess -> Report -> Consult -> Support*.

## 2. The Integrated Workflow (The "Loop")

1.  **Intake & Data (Data Ingestion/Connectors):** EPPs need data from schools (CSV/OneRoster).
2.  **Assessment & Observation:** Using the iPad mode or standard tools.
3.  **Analysis & Intelligence (GovIntel/Insights):** Benchmarking student data against national stats.
4.  **Reporting:** Generating statutory reports.
5.  **Consultation:** Meeting with parents/schools (Calendar/Consulting).
6.  **Growth & Support (Marketplace/Community/Training):** Buying new tests, getting certified, asking peers.

## 3. Implementation Plan

### Step 1: Sidebar Reorganization (Navigation Fix)
We will restructure the sidebar into logical "Functional Groups" rather than just a flat list of features.

*   **Clinical Operations:** Dashboard, Students, Cases, Assessments, Reports.
*   **Consulting Room:** Calendar, Consultations, Messages, Video.
*   **Intelligence & Data:** GovIntel (Benchmarks), Data Ingestion (Import), Insights (Analytics).
*   **Professional Growth:** Marketplace (Store), Community (Forum), Training (CPD).
*   **Practice Management:** Partners (Contractors), Schools, Districts.

### Step 2: Code Changes (`sidebar.tsx`)
*   **Action:** Update `src/components/dashboard/sidebar.tsx` to include the missing links.
*   **Permission Check:** Ensure `can()` checks allow EPPs to see these sections. (e.g., `view_gov_intel` might be missing for EPPs in `permissions.ts`).

### Step 3: Permission Matrix Update
*   **Action:** Audit `src/config/permissions.ts`.
*   **Fix:** Ensure EPPs have:
    *   `view_gov_intel` (for Intelligence)
    *   `manage_data_ingestion` (New permission for import)
    *   `access_community` (New permission)
    *   `access_marketplace` (New permission)

### Step 4: "Owner Console" for Independent EPPs
*   **Context:** Independent EPPs are "Tenant Admins" of their own practice.
*   **Action:** They need a simplified "Practice Settings" view, not the full SuperAdmin "Owner Console".
*   **Logic:** Allow `TenantAdmin` (which an independent EPP is) to see `Schools` and `Districts` management to add their clients.

## 4. Execution Steps (Immediate)

1.  **Update Permissions:** Add missing permissions to `RBAC_MATRIX`.
2.  **Refactor Sidebar:** Group the missing links logically.
3.  **Verify Access:** Log in as EPP and confirm visibility.

## 5. Future: Deep Integration (The "Loop")
*   *Consultation Page:* Add "Import Data" button directly here.
*   *Report Writer:* Add "Insert GovIntel Stat" button sidebar.
*   *Assessment Results:* Add "Discuss in Community" anonymized link.
