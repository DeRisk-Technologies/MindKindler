# MindKindler Regional Architecture & Compliance Implementation Plan

## 1. Overview
This plan addresses critical gaps in the Multi-Region Sharding, Data Sovereignty, and Multi-Tenancy architecture of MindKindler. The primary goal is to ensure Production-Grade compliance with Data Privacy laws (GDPR/FERPA) and strict Role-Based Access Control (RBAC).

## 2. Core Principles (Re-Affirmed)
1.  **Regional Isolation:** PII (Personally Identifiable Information) lives *only* in Regional Shards (`mindkindler-uk`, `mindkindler-us`, etc.).
2.  **Global Routing:** Only non-PII routing data (UID, Region, Email) lives in the Global Default DB.
3.  **Strict RBAC:**
    *   **Global Super Admin:** Manages Regional Super Admins.
    *   **Regional Super Admin:** Manages Tenants (EPPs, Schools, LAs) *within their region only*.
    *   **Tenant Admin (EPP/School):** Manages their own data and sub-entities (e.g., Schools contracted by an EPP).
4.  **Verification Gate:** New Tenants (EPPs/Schools) are "Pending" until verified by a Regional Super Admin.

## 3. Implementation Steps

### Phase 1: Fix Regional Admin & Verification Visibility (Critical)
*   **Objective:** Ensure UK Regional Admin can see and approve UK EPPs.
*   **Problem:** `VerificationQueuePage` currently points to the Default DB for writes and possibly reads, ignoring the Regional Shard.
*   **Action Items:**
    1.  Refactor `src/app/dashboard/admin/verification/page.tsx` to be Shard-Aware.
        *   Read: Use `useFirestoreCollection` with the user's current `shardId`.
        *   Write: Update `updateStatus` function to use `getRegionalDb(userRegion)` instead of default `db`.
    2.  Update `src/app/dashboard/admin/users/page.tsx` to ensure `handleDelete` and `handleSave` also respect the target shard (already partially done, needs verification).

### Phase 2: Enhanced Sign-Up & Identity
*   **Objective:** Capture "Registration Number" (e.g., HCPC, URN) during sign-up for verification.
*   **Action Items:**
    1.  Update `src/app/signup/page.tsx`:
        *   Add `registrationNumber` input field.
        *   Show this field dynamically based on Role (EPP -> HCPC, School -> URN).
        *   Save this field to the Regional Profile (`users/{uid}`).

### Phase 3: EPP Multi-Tenancy (The "Practice" Model)
*   **Objective:** Allow Independent EPPs to manage multiple "Client Schools" with strict data separation.
*   **Concept:**
    *   **Tenant:** The EPP's Practice (e.g., "Dr. Smith Psychology").
    *   **Org Units:** Schools are created as `organizations` or `schools` linked to this Tenant.
    *   **Data Scoping:** All Student/Case records must include `schoolId`.
*   **Action Items:**
    1.  Review/Update `src/app/dashboard/admin/enterprise/new/page.tsx` (or equivalent) to allow Tenant Admins (EPPs) to register "Client Schools".
    2.  Ensure the "Client School" creation writes to the *Regional Shard*.
    3.  Update Global Navigation/Context: When an EPP logs in, if they have multiple schools, allow them to filter/context-switch or simply view all. *Decision: View All with Filter is better for single practitioners.*

### Phase 4: Data Privacy & Rules Enforcement
*   **Objective:** mathematically guarantee that a UK Admin cannot read US data.
*   **Action Items:**
    1.  Audit `firestore.rules` (already distributed to regions).
    2.  Verify `list` queries on `users` collection are restricted by `region` or `tenantId`.
    3.  Ensure `useFirestoreCollection` in the frontend passes `where('region', '==', 'uk')` explicitly where needed to prevent "Missing Index" errors or leaky queries, although physical sharding is the primary defense.

### Phase 5: Verification
1.  **Manual Test:**
    *   Log in as `admin_uk@mindkindler.com`.
    *   Go to Verification Queue.
    *   **Success:** See the pending "Educational Psychologist" account created in the previous step.
    *   **Success:** Approve the account.
    *   **Success:** The EPP user can now log in and see their dashboard.

## 4. Execution Order
1.  **Fix Verification Page** (Unblocks the immediate issue).
2.  **Update Sign-Up** (Required for new correct data).
3.  **Verify EPP "Client School" Creation** (The Multi-Tenancy requirement).
