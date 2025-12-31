# Phase 6A-1: Localization Manual Test Checklist

## 1. Core Runtime & Resolution
- [ ] **Default Load:** Open dashboard as a new user. Verify it loads in `en-GB` (or App Default).
- [ ] **User Switch:** Use the globe icon in header to switch to `fr-FR`. Verify UI text updates (e.g. search bar says "Rechercher...").
- [ ] **Persistence:** Refresh the page. Verify `fr-FR` remains selected.
- [ ] **Tenant Enforcement:**
    1.  Go to Admin > Localization.
    2.  Set Default to `fr-FR`.
    3.  Disable "Allow User Override".
    4.  Reload app as a regular user. Verify UI is forced to `fr-FR`.

## 2. Translation Manager (Overrides)
- [ ] **Drafting:**
    1.  Go to Admin > Translations.
    2.  Select `en-GB` and `common` namespace.
    3.  Find key `dashboard`. Enter override "Command Center".
    4.  Click "Save Draft".
    5.  Verify badge shows "Draft" and UI **does not** change yet.
- [ ] **Publishing:**
    1.  Click "Publish Live".
    2.  Reload the dashboard.
    3.  Verify the sidebar/header link now says "Command Center".
- [ ] **Export/Import:**
    1.  Click "Export JSON". Verify file downloads.
    2.  Modify JSON locally.
    3.  Click "Import JSON". Verify draft values update in the table.

## 3. Glossary Manager (Terminology)
- [ ] **Defining Terms:**
    1.  Go to Admin > Glossary.
    2.  Add term: "Student" -> "Learner".
    3.  Save Draft -> Publish.
- [ ] **AI Verification (Simulation):**
    1.  In a separate test script or component using `applyGlossaryToText`:
    2.  Input: "The student is doing well."
    3.  Output should be: "The Learner is doing well."

## 4. Security & Access
- [ ] **Non-Admin Access:**
    1.  Log in as a standard `Teacher`.
    2.  Try to navigate to `/dashboard/settings/localization`.
    3.  Verify access is denied or page is hidden (based on sidebar logic).
- [ ] **Isolation:**
    1.  Log in as Admin of Tenant A. Override "Dashboard" -> "Tenant A Dash".
    2.  Log in as Admin of Tenant B.
    3.  Verify "Dashboard" is still default, not "Tenant A Dash".

## 5. Offline Resilience
- [ ] **Disconnect Network:** Turn off Wi-Fi / simulate Offline mode.
- [ ] **Navigation:** Move between pages.
- [ ] **Verification:** UI should remain translated using the cached language pack.
- [ ] **Reconnect:** Re-enable network. Verify app remains stable.
