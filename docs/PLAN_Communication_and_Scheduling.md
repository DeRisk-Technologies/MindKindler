# Communication & Scheduling Expansion Plan

## 1. Objective
Enhance MindKindler with a production-grade Appointment/Calendar system, a secure Internal Messaging platform, and an RAG-enabled AI Chatbot. These features aim to streamline EPP workflows, improve parent engagement, and ensure all communications are safe, audited, and compliant.

## 2. Phases & Sprints

### Phase 1: Advanced Appointments & Calendar (Sprint 4)
**Goal:** Reliable booking for consultations with sync, reminders, and consent.

*   **1.1 Data Model (`src/types/schema.ts`)**
    *   Enhance `Appointment`: Add `meetingLink`, `consentRecorded`, `remindersSent`, `syncStatus`, `recurrence`.
    *   New `Availability`: Store EPP working hours, exceptions, and buffer times.
    *   New `CalendarIntegration`: Store OAuth tokens (encrypted) and sync settings for Google/Outlook.

*   **1.2 Services & Backend**
    *   `CalendarService`: Manage availability slots, collision detection, and booking logic.
    *   `Scheduler Functions` (`functions/src/scheduling`):
        *   `findAvailabilitySlots`: Optimized query for free slots.
        *   `sendReminders`: Scheduled job to check upcoming appointments and send SMS/Email.
        *   `syncCalendar`: Webhook handler for external calendar updates (Stub).
    *   `Telemedicine`: Utility to generate Jitsi/Zoom links and store in appointment.

*   **1.3 UI / UX**
    *   `CalendarView`: Interactive weekly/monthly view (using `react-big-calendar` or custom).
    *   `BookingDialog`: Enhanced modal with "Consent for Recording" toggle and "Add Parent" search.
    *   `AvailabilitySettings`: UI for EPPs to define "Office Hours".
    *   `BookingLandingPage`: A simplified view for parents to book specific allowed slots.

### Phase 2: Secure Internal Messaging (Sprint 5)
**Goal:** WhatsApp-like secure chat for EPPs, staff, and parents with audit trails.

*   **2.1 Data Model**
    *   `ChatChannel`: Participants, type (direct/group/case), metadata.
    *   `ChatMessage`: Text, attachments, read receipts, guardian flags.
    *   `ChatAttachment`: Secure file references.

*   **2.2 Services & Backend**
    *   `ChatService`: Firestore listeners for real-time updates.
    *   `MessageGuardian`: Cloud function trigger (or client-side pre-check + server verify) to scan for safeguarding keywords/PII in chats.
    *   `AuditLogging`: Log high-risk messages or attachments.

*   **2.3 UI / UX**
    *   `ChatLayout`: Sidebar (conversations) + Main (messages).
    *   `MessageBubble`: Support for text, images, voice notes (UI stub).
    *   `ChatSearch`: Client-side search of loaded messages.

### Phase 3: AI Copilot & Chatbot (Sprint 6)
**Goal:** RAG-enabled assistant for EPPs and basic guidance for parents.

*   **3.1 Data Model**
    *   `BotSession`: History of user interaction with AI.
    *   `BotMessage`: Content, citations (sourceIds), confidence score.

*   **3.2 Backend (AI)**
    *   `chatWithCopilot` (Cloud Function):
        *   Receive user query.
        *   Retrieve relevant context (Student Profile, Policies) -> RAG.
        *   Generate response with citations.
        *   Run Guardian Post-Check.

*   **3.3 UI / UX**
    *   `CopilotFloat`: Floating widget accessible from any dashboard page.
    *   `CitationViewer`: Popover to see source of AI claims.

## 3. Implementation Plan (Detailed)

### Sprint 4 (Appointments)
1.  **Schema Update**: Add `Availability`, `ExternalCalendar` types.
2.  **Availability Logic**: Implement `calculateSlots(availability, appointments)` in `CalendarService`.
3.  **Calendar UI**: Build the main calendar view with "Click to Book" and "Drag to Reschedule".
4.  **Consent Integration**: Ensure booking saves `consent_recording` boolean if tele-health is selected.

### Sprint 5 (Messaging)
1.  **Schema Update**: `Chat`, `Message` collections.
2.  **Real-time Hook**: `useChat(chatId)` hook using Firestore `onSnapshot`.
3.  **Guardian Integration**: Update `guardianCheck` function to handle `message` context and flag abusive language in real-time.

### Sprint 6 (AI Bot)
1.  **RAG Stub**: Since we don't have a live Vector DB, implement a `retrieveContext` stub that searches Firestore for keywords in `Student` and `Policies`.
2.  **Copilot UI**: Build the chat interface that supports markdown and citation rendering.

## 4. Acceptance Criteria
*   [ ] **Calendar**: Can set availability, book a slot, and see it appear on the calendar.
*   [ ] **Reminders**: Scheduled function logs "Sending reminder" for appointments < 24h away.
*   [ ] **Chat**: Messages appear in real-time between two users; safeguarding words trigger an alert.
*   [ ] **Copilot**: AI answers questions about a student using data from their profile (RAG simulation).
