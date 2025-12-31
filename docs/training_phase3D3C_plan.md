# Training Phase 3D-3C Plan: Offline & Low-Bandwidth Delivery

## Objective
Implement **Offline Mode** for training modules (PWA-style caching) and simulate **USSD/SMS** delivery for low-bandwidth scenarios. Additionally, add **Certificate** issuance and CPD tracking to validate professional development.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **Certificate (New):**
    - `id`, `tenantId`, `userId`, `moduleId`, `issuedAt`, `certificateNumber`.
    - `title`, `hoursAwarded`, `verificationCode`.
- [ ] **MessageOutbox (New - Simulated):**
    - `id`, `channel` ('sms' | 'ussd'), `toUserId`, `payload`, `status`.
- [ ] **TrainingModule (Update):**
    - `cpdHours`: number.
    - `certificateEnabled`: boolean.
    - `smsSummarySegments`: string[].

## 2. Offline Mode (PWA-Lite)
**Path:** `src/app/dashboard/training/library/[id]/page.tsx`

- [ ] **Caching Logic:**
    - Use `localStorage` (Phase 1) to store module content when "Save for Offline" is clicked.
    - Check network status (`navigator.onLine`).
    - If offline, load from storage.
- [ ] **Sync:**
    - If completed while offline, store completion event in `offlineQueue` (localStorage).
    - Sync when online detected.

## 3. USSD/SMS Simulation
**Path:** `src/app/dashboard/training/delivery/page.tsx`

- [ ] **UI:**
    - Select Module -> Select Channel (SMS/USSD).
    - Preview "Micro-Summary" (160 chars).
    - "Send" button writes to `messageOutbox`.
- [ ] **Mock Gateway:**
    - Display a list of "Sent" messages in the UI to prove flow.

## 4. Certificates & CPD
**Path:** `src/app/dashboard/training/certificates` (New Module)

- [ ] **List Page:** View my earned certificates.
- [ ] **Detail Page (`/[id]`):**
    - Render HTML Certificate.
    - Print/Download button.
- [ ] **Transcript (`/transcript`):**
    - Summary of total CPD hours.

## 5. Execution Steps
1.  **Schema**: Add Certificate & Outbox types.
2.  **Offline**: Update Module Player with "Save Offline" and offline detection.
3.  **Delivery**: Build the SMS/USSD simulator page.
4.  **Certificates**: Build the Certificate Viewer and Transcript page.
5.  **Integration**: Update Module Complete action to issue certificate if enabled.

## Manual Test Checklist
- [ ] **Offline**: Open a module. Click "Save for Offline". Disconnect internet (DevTools). Refresh. Verify content loads.
- [ ] **Delivery**: Go to "Delivery". Send an SMS summary. Verify it appears in the log.
- [ ] **Certificate**: Complete a module (ensure `certificateEnabled=true` in DB or mock). Go to "Certificates". Verify new cert exists. Print it.
