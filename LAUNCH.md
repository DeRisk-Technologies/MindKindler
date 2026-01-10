# MindKindler UK Pilot: Technical Launch Runbook

**Version:** 1.0  
**Date:** 2026-01-09  
**Role:** DevOps / Tech Lead

---

## 1. Prerequisites

Before launching the environment, ensure the following are installed:

*   **Node.js:** v20 (LTS) - Essential for Next.js & Cloud Functions.
*   **Java (JDK 11+):** Required for Firebase Emulators (Firestore/Auth).
*   **Firebase CLI:** `npm install -g firebase-tools`
*   **Git:** To pull the latest repository state.

---

## 2. Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    cd functions && npm install && cd ..
    ```

2.  **Environment Configuration:**
    *   Duplicate the example file:
        ```bash
        cp .env.local.example .env.local
        ```
    *   **Edit `.env.local`:** Fill in the actual API Keys (Firebase, Vertex AI) from the Google Cloud Console. 
    *   *Note: For the local pilot, the Emulator suite handles most backend logic, but Genkit still needs a real Vertex AI connection.*

---

## 3. Launching the Pilot Environment

We have created a single convenience command to spin up the entire stack.

```bash
npm run pilot:start
```

**What this does:**
1.  Starts the **Firebase Emulators** (Auth, Firestore, Functions) on ports `4000`, `8080`, `5001`.
2.  Starts the **Next.js Dev Server** on port `9002`.

**Access:**
*   **Frontend:** `http://localhost:9002`
*   **Emulator UI:** `http://localhost:4000`

---

## 4. Seeding the Data (The "Super-Seed")

Once the emulators are running, you must populate the database with the "Charlie/Sammy/Riley" training scenarios.

1.  Open a **new terminal window** (keep the server running).
2.  Run the seed script:
    ```bash
    npm run pilot:reset
    ```
    *   *This triggers the `seedDemoData` Cloud Function via the shell.*
3.  Verify in the Emulator UI (`localhost:4000` -> Firestore) that `mindkindler-uk` database now contains `students` and `reports`.

---

## 5. Handover

1.  Open `http://localhost:9002` in Chrome.
2.  Log in as **Dr. Sarah Super** (`sarah.super@pilot.com` / `Password123!`).
3.  You are now ready to hand the laptop to the Pilot EPP.

**Emergency Reset:**
If the data gets corrupted during a demo, just run `npm run pilot:reset` again. It resets the state instantly.
