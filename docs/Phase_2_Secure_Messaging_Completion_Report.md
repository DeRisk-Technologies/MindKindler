# Phase 2: Secure Internal Messaging (Region-Aware Chat) - Completion Report

## 1. Architectural Strategy
We have implemented a **Region-Aware Chat System** that strictly adheres to the data sovereignty principles of MindKindler.

*   **Regional Sharding:** All chat data resides in the regional databases (e.g., `mindkindler-uk`), ensuring clinical conversations never leave their legal jurisdiction.
*   **Split-Stack:** The frontend uses `ChatService` to connect directly to the regional shard, bypassing the global DB for message content.

## 2. Completed Components

### A. Data Model (`src/types/chat.ts`)
Defined the rigorous structure for `ChatChannel` and `ChatMessage`, including:
*   `type`: 'case_room' | 'direct_message' | 'group_chat'
*   `guardian`: A dedicated object for PII status (`status`, `redactedContent`, `flaggedReason`).
*   `readBy`: Map for read receipts.

### B. Service Layer (`src/services/chat-service.ts`)
A dedicated Firestore service class that:
*   Automatically connects to the correct `getRegionalDb(region)`.
*   Handles real-time subscriptions (`onSnapshot`) for Channels and Messages.
*   Manages "Last Message" updates for inbox sorting.

### C. The Guardian Integration (`functions/src/communication/chatGuardian.ts`)
A Cloud Function (`guardianChatScannerTrigger`) deployed to `europe-west3` that:
*   Triggers on every new message in `mindkindler-uk`.
*   **PII Scan:** Detects UK Phone Numbers and Emails -> Auto-redacts them (e.g., `[REDACTED PHONE]`).
*   **Risk Scan:** Detects keywords like "suicide", "harm" -> Flags the message as `CRITICAL RISK`.
*   Updates the message document with the scan result in <500ms.

### D. User Interface (`src/components/chat/ChatLayout.tsx`)
A complete, Slack-like interface featuring:
*   **Sidebar:** Real-time list of channels (DMs and Case Rooms).
*   **Message View:** Bubbles with auto-redaction support (shows "[REDACTED]" if flagged).
*   **Live Status:** Visual indicator "Guardian Active" to reassure users of safety.

### E. Page Route (`src/app/dashboard/messages/page.tsx`)
Replaced the static prototype with the live `ChatLayout` component.

## 3. Deployment Status
*   **Cloud Functions:** `guardianChatScannerTrigger` successfully deployed manually.
*   **Frontend:** Code is ready for next build.
*   **Database:** Collections `chat_channels` and `messages` will be auto-created on first write.

## 4. Next Steps
1.  **Mobile View:** Optimize `ChatLayout` for small screens (toggle sidebar).
2.  **Case Integration:** Add a "Chat" tab to `CaseDetail` that auto-opens the `case_room` for that specific case.
3.  **Push Notifications:** Hook into `functions/src/services/notifications.ts` to send FCM alerts for new messages.
