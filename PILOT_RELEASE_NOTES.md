# MindKindler UK Pilot: Official Release Candidate (v1.0)

**Status:** Ready for Launch  
**Date:** January 2026  
**Environment:** UK Pilot (Sharded)  

---

## 1. Quick Start (Reset & Launch)

To prepare the environment for a fresh pilot demonstration, execute the following commands in your terminal:

```bash
# 1. Reset Database & Seed Mock Data (Commercial, Telemetry, & Safeguarding scenarios included)
npm run pilot:reset

# 2. Launch the Platform (Requires Environment Keys)
npm run pilot:start
```

*Note: The system will perform a Pre-Flight Check (`pilot:check`) to ensure all API keys (`STRIPE`, `OPENAI/GEMINI`, `FIREBASE`, `SENDGRID`) are present before starting.*

---

## 2. Login Credentials

Access the dashboard at: `http://localhost:9002`

*   **Role:** Educational Psychologist (EPP)
*   **Email:** `sarah.super@pilot.com`
*   **Password:** `PilotUK2026!`

---

## 3. Demo Scenarios (The "Happy Paths")

Follow these scripts to demonstrate the core value propositions of MindKindler.

### Scenario A: The "Red Button" (Safeguarding Escalation)
**Goal:** Demonstrate clinical safety and immediate response.

1.  **Login** as Dr. Sarah.
2.  **Navigate** to the **Cases** list.
3.  **Search** for "Sammy Safeguard" (Pre-seeded high-risk case).
4.  **Enter Consultation:** Click "Start Session" or "Resume" on Sammy's active session.
5.  **Trigger:** In the **Post-Session Synthesis** view, click the red **"⚠️ REPORT URGENT RISK"** button in the header.
6.  **Modal:**
    *   Observe the "Critical Safeguarding Protocol" modal.
    *   Select "Mother" and "Social Services" from the pre-populated contacts list.
    *   Select "Send Evidence Email".
    *   Add a clinical note: "Disclosed intent to self-harm tonight."
    *   Click **"CONFIRM ESCALATION"**.
7.  **Verify:**
    *   Toast notification: "Safeguarding Protocol Initiated".
    *   **Governance Check:** Go to **Dashboard > Intelligence > Safeguarding**.
    *   Confirm the new "Crisis Audit Log" entry appears at the top (Red/Immediate).
    *   Click "Review" to see the full audit trail and immutable logs.

### Scenario B: AI Risk Detection ("Safety Drill")
**Goal:** Demonstrate the AI's ability to catch risks automatically.

1.  **Navigate** to **Consultations**.
2.  **Open** the draft session for "Riley Risk" (Pre-seeded).
3.  **Action:** The AI engine scans the transcript immediately.
4.  **Observation:**
    *   Notice the "Risk Detected" alert banner or badge (if implemented in UI).
    *   Or, in the **Post-Session Synthesis**, look for the "Safeguarding" tab or section highlighting the keywords: *"ending it all"*.
5.  **Resolution:** Use the "Red Button" workflow to escalate this AI-detected risk.

### Scenario C: Commercial Marketplace (Installing a Pack)
**Goal:** Demonstrate monetization and extensibility.

1.  **Navigate** to **Marketplace**.
2.  **Find Pack:** Locate the **"Advanced Sensory Processing"** pack (£49.99).
3.  **Install:** Click "Subscribe / Start Trial".
4.  **Stripe Flow:**
    *   The system redirects to the Stripe Checkout (Mock/Test mode).
    *   Enter test card details (4242 4242...).
    *   Complete purchase.
5.  **Verify:**
    *   Redirects back to "Success" page.
    *   Go to **Dashboard > Marketplace > Installed**.
    *   Verify "Advanced Sensory Processing" is listed as **Active**.

### Scenario D: The "Magic Link" (Parental Contribution)
**Goal:** Demonstrate secure external data gathering.

1.  **Navigate** to **Cases** > **Charlie Complex**.
2.  **Action:** Click "Request Contribution" > "Parent View".
3.  **Send:** Confirm email to "parent@example.com".
4.  **Simulate:**
    *   Check the terminal logs (if `PILOT_SAFE_MODE=true`) to see the intercepted email with the Magic Link.
    *   *Or* copy the link from the "External Requests" audit log in Firestore/UI.
5.  **Access:** Open the link in an Incognito window.
6.  **Submit:** Fill out the secure form as a parent and submit.
7.  **Result:** Refresh Dr. Sarah's dashboard to see the "New Evidence" alert on Charlie's case.

---

## 4. Manual Test Checklist (Pre-Demo)

Before the live demo, verify these systems are green:

- [ ] **Email Safety:** `PILOT_SAFE_MODE=true` is set.
- [ ] **Stripe Keys:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured.
- [ ] **Cloud Functions:** `processEmailQueueV2`, `createStripeCheckoutV2`, and `stripeWebhookV2` are deployed.
- [ ] **Seed Data:** `Sammy Safeguard` and `Riley Risk` appear in the student list.
- [ ] **Governance:** The Safeguarding Dashboard loads without errors.

---

*Confidential - For Internal Pilot Use Only*
