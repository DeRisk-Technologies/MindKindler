# Final UAT: MindKindler "Country OS" Validation

This guide validates that MindKindler successfully adapts its schema, logic, and security model to the UK statutory context.

## 1. The "Zero State" Baseline
**Goal:** Confirm the system starts as a generic "Global" SaaS without UK-specific fields.

*   [ ] **Login as SuperAdmin**.
*   [ ] Navigate to **/dashboard/students/new**.
*   [ ] Scroll to the "Academic Info" section.
*   [ ] **Verify:** The field "Unique Pupil Number (UPN)" is **NOT** visible.
*   [ ] **Verify:** The field "Pupil Premium" is **NOT** visible.
*   [ ] Navigate to **/dashboard/staff/new** (via URL or button if visible).
*   [ ] **Verify:** The "Vetting & Safer Recruitment (SCR)" section is **NOT** visible.

## 2. The Installation (Turning the Key)
**Goal:** Inject the UK Country Pack into the tenant's configuration.

*   [ ] Navigate to **/dashboard/marketplace**.
*   [ ] Locate the **"UK Local Authority Standard"** pack.
*   [ ] **Check:** It should have a "Recommended" badge (if tenant region is UK) or be visible in the list.
*   [ ] Click **"Install Pack"**.
*   [ ] **Verify:** The button changes to "Configuring Tenant...".
*   [ ] **Verify:** A success toast appears: "Installation Complete".
*   [ ] **Check:** The button now says "Installed" (disabled).

## 3. The "Dynamic UI" Verification
**Goal:** Confirm the "Schema Injection" worked and forms are now context-aware.

*   [ ] Return to **/dashboard/students/new**.
*   [ ] **Verify:** A new section "Regional Requirements" appears.
*   [ ] **Verify:** Fields "Unique Pupil Number (UPN)" and "Pupil Premium" are now **visible**.
*   [ ] **Test:** Enter a dummy UPN.
*   [ ] Go to **/dashboard/staff/new**.
*   [ ] **Verify:** A new Amber-colored section "Vetting & Safer Recruitment (SCR)" appears.
*   [ ] **Verify:** Fields "DBS Certificate Number" (Masked) and "Prohibition Check" are visible.

## 4. The "Trust & Safety" Loop (RBAC + HCPC)
**Goal:** Verify that unregistered professionals are blocked from sensitive data.

*   [ ] **Create User:** Create a new user account with role `EPP` (Educational Psychologist).
*   [ ] **Login:** Login as this new EPP.
*   [ ] **Attempt Access:** Navigate to a Student Profile -> "Assessment" Tab.
*   [ ] **Verify Block:** You should see a "Restricted Access" shield icon. The WISC-V chart should **NOT** be visible.
*   [ ] **Admin Action:** Login as SuperAdmin/TenantAdmin.
*   [ ] Go to **/dashboard/admin/verification**.
*   [ ] **Verify Queue:** The new EPP should appear in the list with status "Pending".
*   [ ] Click **"Approve"**.
*   [ ] **Verify Success:** Toast "Practitioner Verified".
*   [ ] **Re-Login:** Login as the EPP again.
*   [ ] **Verify Access:** Go to the Student Profile -> "Assessment" Tab. The WISC-V Chart and Interventions should now be **visible**.
*   [ ] **Check Header:** A green "HCPC Verified" badge should appear next to your name.

## 5. The "Clinical Value" Loop
**Goal:** Confirm the engines (Psychometric & Logic) are producing actionable insights.

*   [ ] As the verified EPP, viewing the Student Profile (Assessment Tab):
*   [ ] **Check Chart:** Verify the WISC-V chart renders.
*   [ ] **Verify Error Bars:** Hover over a bar. Confirm the tooltip says "Range: 77 - 87" (or similar), proving the 95% Confidence Interval logic is active.
*   [ ] **Check Recommendations:** Scroll down to "Recommended Interventions".
*   [ ] **Verify Logic:** If the mock score for VCI is 82, confirm you see "ELKLAN Language Builders" or "Talk Boost" listed (Triggered by < 85 rule).
*   [ ] Click **"Generate Draft Report"** (Report Builder).
*   [ ] Select **"EHCP Needs Assessment"**.
*   [ ] **Verify Warning:** See the "Compliance Mode Active" alert: "Constraints: No Medical Diagnosis".

## 6. The "Data Sovereignty" Audit
**Goal:** Ensure PII is physically stored in the correct Regional Shard.

*   [ ] As SuperAdmin, create a new Staff Member via **/dashboard/staff/new**.
*   [ ] Enter "Jane Doe", Role "Teacher", and a DBS Number.
*   [ ] Click **"Save to Register"**.
*   [ ] **Backend Check:** (If possible) Open Firestore Console.
*   [ ] Navigate to the **Regional DB** (e.g., `mindkindler-uk` or mocked regional path).
*   [ ] **Verify:** The record exists in `tenants/{id}/staff`.
*   [ ] **Verify Encryption:** Check the `scr_dbs_number` field. (If client-side encryption was fully active, it would be cyphertext. For V1 MVP, confirm it is present in the secured shard).

---
**Status:** If all 6 scenarios pass, MindKindler is certified for UK Deployment.
