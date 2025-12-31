# Integration Phase 5A-3 Plan: Real-Time Sync & Webhooks

## Objective
Establish the **Real-Time Sync Framework** to support bidirectional data flow (Pull/Push) and event-driven updates (Webhooks). This builds on the Integration Hub foundation by adding robust state management, conflict resolution, and health monitoring.

## 1. Data Model Strategy
**File:** `src/types/schema.ts` (Update)

- [ ] **SyncRun (New):**
    - `id`, `integrationId`, `runType` ('manual', 'scheduled', 'webhook')
    - `status`, `counts`, `cursorBefore`, `cursorAfter`
- [ ] **SyncCursor (New):**
    - `id` (integrationId_entityType), `cursor`, `lastSyncAt`
- [ ] **SyncConflict (New):**
    - `id`, `entityType`, `recordId`, `status` ('open', 'resolved')
    - `localSnapshot`, `remoteSnapshot`, `resolution`
- [ ] **SyncDeadLetter (New):**
    - `id`, `payload`, `error`, `retryCount`, `nextRetryAt`

## 2. Sync Engine Framework
**Path:** `src/integrations/framework/connector.ts` (New)

- [ ] **Interface**: Define `Connector` contract (`pullChanges`, `pushChanges`, `normalize`).

**Path:** `src/integrations/framework/syncEngine.ts` (New)

- [ ] **Logic**:
    - `runSync(integrationId, entities[])`: Orchestrator.
    - `applyChanges()`: Writes to Firestore.
    - `handleConflict()`: Detects overwrite risks.

**Path:** `src/integrations/framework/conflicts.ts` (New)

- [ ] **Logic**: Simple timestamp-based conflict detection.

## 3. Connectors (Scaffold)
**Path:** `src/integrations/connectors/oneroster/index.ts` (New)

- [ ] **Mock Adapter**: Simulates an API returning student/teacher lists.

**Path:** `src/integrations/connectors/edfi/index.ts` (New)

- [ ] **Mock Adapter**: Placeholder for Ed-Fi logic.

## 4. UI Implementation
**Path:** `src/app/dashboard/integrations/health` (New Module)

- [ ] **Health Dashboard (`/page.tsx`)**:
    - List active syncs, error rates, last run times.
- [ ] **Detail View (`/[id]/page.tsx`)**:
    - **Run History**: Table of `SyncRuns`.
    - **Conflicts**: List of open conflicts with "Resolve" actions.
    - **Dead Letters**: Failed payloads with "Retry" button.

## 5. Webhook Ingestion
**Path:** `src/app/api/webhooks/[connector]/route.ts` (New)

- [ ] **Handler**: Accepts POST, validates (mock), logs `SyncRun`, triggers engine.

## 6. Execution Steps
1.  **Schema**: Add Sync types.
2.  **Framework**: Build Engine, Connector Interface, and Conflict logic.
3.  **Connectors**: Implement OneRoster mock.
4.  **UI**: Build Health Dashboard & Detail pages.
5.  **API**: Add Webhook route.
6.  **Integration**: Add "OneRoster" to the main Integration Hub list.

## Manual Test Checklist
- [ ] **Setup**: Enable "OneRoster (Mock)" in Integration Hub.
- [ ] **Sync**: Go to Health Dashboard. Click "Run Sync". Verify success log.
- [ ] **Conflict**: Manually create a conflict (simulated). Resolve it in UI.
- [ ] **Webhook**: Curl the webhook endpoint. Verify a "Webhook" type run appears in history.
