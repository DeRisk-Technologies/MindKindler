# MindKindler UK Statutory OS - Pilot Test Manual

**Version:** 1.0.0
**Context:** Verification of the 20-Week EHCP Workflow, Guardian AI, and Reporting Suite.

---

## 🚀 Pre-Flight Check: Data Injection

Before testing the UI, we must inject the "Yorkshire Pilot" scenario into the database. This gives you 3 active cases in different stages of the lifecycle.

**Step 1: Run the Seeder**
Open your terminal in the project root and run:
\`\`\`bash
# If using ts-node
npx ts-node src/scripts/seed-pilot-data.ts

# Or if just compiling
# tsc src/scripts/seed-pilot-data.ts && node src/scripts/seed-pilot-data.js
\`\`\`
*Expected Output:* `✅ Seeding Complete! Ready for Pilot Demo.`

---

## 🧪 Test Scenario 1: The "Breach Risk" (Admin View)

**Role:** District Admin / Lead EPP
**Goal:** Identify the critical statutory breach immediately upon login.

1.  **Navigate to Home:** Go to `http://localhost:3000/`.
2.  **View:** Ensure you are in **"Admin View"** (Click the toggle bottom-right if needed).
3.  **Guardian Dashboard:**
    *   Locate the **"Breach Projections"** card (Top Left). It should be **RED** showing `1/45`.
    *   Locate the **"Risk Radar"**. You should see a **Critical Priority** alert for "Sibling Risk" (Alex Jeffery).
4.  **Drill Down:**
    *   Switch to **"EPP View"** (Bottom right toggle).
    *   Look at the Case List. Find **"Sarah Smith"**.
    *   Verify the **Progress Bar** is Red and says **"BREACH"**.

---

## 🧪 Test Scenario 2: The "Intelligent Intake" (New Case)

**Role:** Intake Clerk / EPP
**Goal:** Onboard a new student using the AI Wizard.

1.  **Start Intake:** Click **"Intake Wizard"** in the sidebar.
2.  **Step 1: Upload**
    *   Drag & Drop any PDF (or click the box).
    *   Watch the **"Scanning..."** animation.
    *   See the file tagged as "Medical Report" (Mocked AI).
3.  **Step 2: Verify People**
    *   See "Jane Doe (Parent)" pre-filled.
    *   **Action:** Add a new person manually (e.g., "Dr. Who", Role: Pediatrician).
    *   Click "Confirm Stakeholders".
4.  **Step 3: Verify Facts**
    *   See the **Request Date** pre-filled (Today).
    *   See the **Risk Warning**: "Risk Signals Detected" (from the Seed Logic).
    *   **Action:** Try to click "Finalize" without checking the box. (Should block you).
    *   Check the box and click "Finalize".
5.  **Result:** You should be redirected to the Dashboard for this new case.

---

## 🧪 Test Scenario 3: The "Report Drafting" (Clinical View)

**Role:** Educational Psychologist
**Goal:** Triangulate evidence and draft Section F for "XX Jeffery".

1.  **Open Case:** From the Case List, click on **"XX Jeffery"**.
2.  **Check Status:** Verify the Top Stepper shows **"Drafting"** (Blue/Active).
3.  **Enter Workspace:** Click the **"Drafting Phase"** button (or navigate to `/dashboard/case/case-a-jeffery/drafting`).
4.  **Tab 1: Evidence Base**
    *   See the findings categorized (Cognition, Sensory, etc.).
    *   Notice the **Amber Alert** on the "School Attendance" finding (Contradiction).
    *   **Action:** Click the **Green Check** to approve the "Hyperlexia" finding.
5.  **Tab 2: Provision Plan**
    *   Switch to the "Provision Plan" tab.
    *   See the **Section F** table.
    *   **Action:** Click "Add Provision" under Cognition.
    *   Type: "Weekly Phonics". Frequency: "Daily". Staffing: "TA".
    *   Click "Save Draft".

---

## 🧪 Test Scenario 4: The "Parent Loop" (Secure Portal)

**Role:** Parent (External)
**Goal:** Review the draft via a secure link.

1.  **Generate Link:** (Simulated) In your browser, navigate to:
    `http://localhost:3000/portal/review?token=valid-token-123`
2.  **Parent View:**
    *   You should see the "MindKindler Secure Review" header (No Sidebar).
    *   Read the "Background History".
    *   **Action:** Click **"Add Comment"** next to Section B.
    *   Type: "He actually hates loud noises."
    *   Click "Submit Feedback".
3.  **Finish:** Click "Submit & Finish" in the top right.

---

## 📦 Marketplace Verification

**Goal:** Confirm the module is "Installed".

1.  Navigate to `/dashboard/marketplace/installed` (if route exists) OR check the console logs during app startup.
2.  Verify `uk_statutory_os` is listed as active.
3.  *Note:* The features above (Intake, Guardian, Drafting) *are* the proof of installation.

---

## ✅ Success Criteria

The Pilot is considered successful if:
1.  **Safety:** The Systemic Risk (Sibling) was flagged in the Guardian View.
2.  **Compliance:** The Breach Case (Sarah Smith) was visually obvious (Red).
3.  **Efficiency:** The Report Editor allowed seamless editing of Findings and Provisions.
4.  **Security:** The Parent Portal allowed feedback without logging in.
