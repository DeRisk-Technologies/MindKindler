# MindKindler UK Pilot: Official Release Candidate (v1.0)

**Status:** Ready for Launch  
**Date:** January 2026  
**Environment:** UK Pilot (Sharded)  

---

## 1. Quick Start (Reset & Launch)

To prepare the environment for a fresh pilot demonstration, execute the following commands in your terminal:

```bash
# 1. Reset Database & Seed Mock Data (Commercial & Telemetry included)
npm run pilot:reset

# 2. Launch the Platform (Requires Environment Keys)
npm run pilot:start
```

*Note: The system will perform a Pre-Flight Check (`pilot:check`) to ensure all API keys (`STRIPE`, `OPENAI/GEMINI`, `FIREBASE`) are present before starting.*

---

## 2. Login Credentials

Access the dashboard at: `http://localhost:9002`

*   **Role:** Educational Psychologist (EPP)
*   **Email:** `sarah.super@pilot.com`
*   **Password:** `PilotUK2026!`

---

## 3. Demo Scenarios (The "Happy Paths")

Follow these scripts to demonstrate the core value propositions of MindKindler.

### A. The Commercial Path (Monetization)
*Showcase the ability to upsell clinical tools directly within the workflow.*

1.  Navigate to **Marketplace** (Sidebar).
2.  Locate the **"Advanced Sensory Processing"** pack (Price: £49.99).
3.  Click **"Subscribe for £49.99/mo"**.
4.  Observe the redirection to the **Stripe Secure Checkout** (simulated).
5.  Upon success, you will be redirected to the **Success Page** with a confetti celebration.
6.  The pack is now **Installed** and ready for use in reports.

### B. The Intelligence Path (Gap Scanner)
*Showcase the AI's ability to learn from the human expert.*

1.  Navigate to **Dashboard (Home)**.
2.  Look for the **"Recommended Training"** widget.
3.  You will see a recommendation: **"Advanced Sensory Processing"**.
    *   *Why?* The seed script injected 5 historic reports where Dr. Sarah significantly rewrote the AI's "Sensory" draft (>45% edit distance).
4.  Clicking this links directly to the Marketplace item, closing the continuous learning loop.

### C. The Triangulation Path (External Portal)
*Showcase the secure, magic-link workflow for gathering evidence.*

1.  **EPP View:**
    *   Go to **Cases > Charlie Complex**.
    *   Click the **"Evidence Bank"** tab.
    *   Use the **Request Widget** to send a "Parent View" request to `parent@example.com`.
2.  **Parent View (Simulation):**
    *   Open an **Incognito Window**.
    *   Paste the Demo Link: `http://localhost:9002/portal/contribute/demo_request_1?token=demo_token_123`
    *   Fill out the **"All About Me"** form (Strengths, Aspirations).
    *   Click **Submit**.
3.  **The Result:**
    *   Return to the EPP Dashboard (Charlie Complex).
    *   Refresh the page.
    *   The **"Family Voice Panel"** now displays the live data you just submitted.
    *   The **"Statutory Output"** generator will now automatically include this data ("Source 2: Parent Views").

---

## 4. Known Issues & Workarounds

*   **PDF Export:** If PDF generation is slow locally, ensure the Cloud Functions emulator has enough memory allocated (`2GB`).
*   **Emails:** Emails are currently logged to the console/terminal instead of being sent via SMTP in this dev environment. Check your terminal for "Magic Link Generated" logs.

---

**End of Release Notes**
