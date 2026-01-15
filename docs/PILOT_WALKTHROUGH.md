# MindKindler Pilot: End-to-End Walkthrough

**Objective:** Verify the deployment of the Statutory Case Management OS (Phases 45-56).
**Prerequisites:** Node.js, Firebase CLI, and a Firebase Project.

---

## 🛠️ Step 1: Environment Setup

The Pilot features rely on `date-fns` and specific local libraries. Ensure all dependencies are fresh.

\`\`\`bash
# 1. Install Dependencies
npm install

# 2. Compile TypeScript (to ensure no type errors in the new modules)
npx tsc --noEmit
\`\`\`

---

## 🌱 Step 2: Database Seeding (Crucial)

We need to inject the "Yorkshire Scenario" (3 interconnected cases) to trigger the alerts.

\`\`\`bash
# Run the Seed Script using ts-node
npx ts-node src/scripts/seed-pilot-data.ts
\`\`\`

**Verification:**
*   Console should print: `✅ Seeding Complete! Ready for Pilot Demo.`
*   If you check your Firestore Console, you should see a `cases` collection with IDs like `case-a-jeffery` and `case-c-smith`.

---

## 🚀 Step 3: Launching the Interface

We will run the application locally to test the UI interactions.

\`\`\`bash
# Start the Next.js Development Server
npm run dev
\`\`\`

Open your browser to: **http://localhost:3000**

---

## 🕵️ Step 4: Feature Verification Checklist

### Phase A: The Command Center (Admin Role)
1.  **Landing:** You should land immediately on the **Active Caseload** list.
2.  **Toggle View:** In the bottom-right corner, click **"Admin View"**.
3.  **Guardian Dashboard:**
    *   [ ] Check **Breach Projections**: Is the number **> 0** and **Red**? (Triggered by Case C).
    *   [ ] Check **Risk Radar**: Do you see a **Critical** alert for "Sibling Risk"? (Triggered by Case B).
    *   [ ] Check **School Cluster**: Do you see a **High** alert for "St. Mary's / York High"? (Triggered by Case D/E/F).

### Phase B: The Workflow (EPP Role)
1.  **Switch Back:** Click **"EPP View"**.
2.  **Open Case:** Click on **"Sarah Smith"** (The Breach Case).
3.  **Visuals:**
    *   [ ] Verify the **Progress Bar** at the top is Red/Breached.
    *   [ ] Verify the **Breach Countdown** widget is flashing/red.

### Phase C: The Workhorse (Drafting)
1.  **Navigate:** Go back to Home -> Click **"XX Jeffery"**.
2.  **Enter Drafting:** Click the "Active Phase Tools" button or navigate to the Drafting tab.
3.  **Triangulation (Tab 1):**
    *   [ ] Find the "School Attendance" finding. Is it highlighted **Amber** (Contested)?
    *   [ ] Click the **Green Check** on the "Hyperlexia" finding.
4.  **Provision (Tab 2):**
    *   [ ] Click **"Add Provision"**.
    *   [ ] Enter text into the "Outcome" and "Provision" boxes.
    *   [ ] Verify the table layout resembles a legal document.

### Phase D: The Intake (Clerk Role)
1.  **Navigate:** Click **"Intake Wizard"** in the sidebar.
2.  **Upload:** Drag a dummy file into the box.
3.  **AI Verification:**
    *   [ ] Wait for the "Scanning" bar to finish.
    *   [ ] In Step 3 (Facts), ensure you **cannot** proceed without checking the "Risk Acknowledgment" box.

### Phase E: The Parent Loop (External)
1.  **Simulate Link:** Manually navigate to:
    `http://localhost:3000/portal/review?token=test-token-123`
2.  **Experience:**
    *   [ ] Verify there is **NO Sidebar** (Secure Guest Mode).
    *   [ ] Click **"Add Comment"** on a section.
    *   [ ] Submit the feedback and see the "Success" screen.

---

## 🚢 Step 5: Optional Deployment

If you want to share this with stakeholders:

\`\`\`bash
# Build the application
npm run build

# Deploy only the hosting (frontend)
firebase deploy --only hosting
\`\`\`

*Note: You do not need to deploy functions for this Pilot version.*
