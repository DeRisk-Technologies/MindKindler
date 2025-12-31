# Platform Phase 6A Plan: Unified Notification Center

## Objective
Implement a centralized notification system to aggregate alerts from all MindKindler modules (Assessments, Guardian, Training, Partners). This ensures users never miss critical updates, regardless of where they originate in the system.

## 1. Data Model Enhancements
**File:** `src/types/schema.ts`

- [ ] **Notification (New):**
    - `id`, `tenantId`, `recipientUserId`
    - `type`: 'info' | 'success' | 'warning' | 'error' | 'action_required'
    - `category`: 'assessment' | 'training' | 'guardian' | 'partner' | 'system'
    - `title`, `message`, `link`
    - `read`: boolean
    - `createdAt`
    - `metadata`: Record<string, any>
- [ ] **NotificationPreferences (New):**
    - `userId`
    - `channels`: { email, sms, push }
    - `categories`: { assessment, training, guardian, partner, system }

## 2. Notification Service
**Path:** `src/lib/notifications.ts`

- [ ] **`sendNotification(payload)`**:
    - Checks user preferences (mocked for now).
    - Writes to `notifications` collection.
    - (Future: Trigger external email/SMS).
- [ ] **`markAsRead(id)`**: Updates status.
- [ ] **`markAllAsRead(userId)`**: Bulk update.

## 3. UI Implementation
- [ ] **Notification Bell (`src/components/dashboard/notifications/notification-bell.tsx`)**:
    - Navbar component.
    - Shows unread badge count.
    - Popover with recent list and "Mark all read" action.
- [ ] **Notification History (`src/app/dashboard/notifications/page.tsx`)**:
    - Full page list with filters (unread, category).
- [ ] **Preferences (`src/app/dashboard/settings/notifications/page.tsx`)**:
    - Toggle switches for channels and categories.
- [ ] **Tester (`src/app/dashboard/notifications/tester/page.tsx`)**:
    - Dev tool to fire mock notifications for testing.

## 4. Integration Strategy
- Since we cannot refactor every previous file in one go, we will use the **Tester** page to validate the system end-to-end.
- Future phases will replace `toast()` calls with `sendNotification()` where persistence is needed.

## 5. Execution Steps
1.  **Schema**: Add types.
2.  **Service**: Build `notifications.ts`.
3.  **UI**: Build Bell, History, Preferences, and Tester.
4.  **Integration**: Add Bell to Layout (if accessible) or just verify via pages.

## Manual Test Checklist
- [ ] **Simulate**: Go to Tester page. Send a "Guardian Warning".
- [ ] **Verify Bell**: Check top nav bell for badge. Open popover.
- [ ] **Read**: Click notification. Verify it marks as read (badge count decr).
- [ ] **History**: Go to History page. Verify it's listed there.
- [ ] **Preferences**: Go to Settings. Toggle "Guardian" off. (Mock check: Service should log "Skipped due to pref").
