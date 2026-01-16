import { Timestamp } from "firebase/firestore";

/**
 * Defines the type of a chat channel.
 * - 'case_room': A channel dedicated to a specific statutory case (Case #123).
 * - 'direct_message': A 1:1 conversation between two users.
 * - 'group_chat': An ad-hoc group discussion.
 */
export type ChatChannelType = 'case_room' | 'direct_message' | 'group_chat';

/**
 * Represents a user's presence/role in a chat channel.
 * Denormalized for UI performance to avoid extra user lookups.
 */
export interface ChatParticipant {
  displayName: string;
  role: string; // e.g., "Educational Psychologist", "Parent", "Admin"
  avatarUrl?: string;
  email: string;
}

/**
 * Represents a secure communication channel stored in a Regional Shard.
 * @collection chat_channels
 */
export interface ChatChannel {
  id: string;
  tenantId: string;       // For multi-tenant isolation within the region
  type: ChatChannelType;
  
  // Context - Critical for Case Management integration
  caseId?: string;        // If linked to a specific Clinical Case
  studentId?: string;     // If linked to a Student
  
  // Participants
  participantIds: string[]; // Array of User UIDs for security rules (Firestore Rules)
  participants: {           // Denormalized map for UI rendering
    [uid: string]: ChatParticipant;
  };

  // Metadata
  displayName?: string;   // Optional override. Defaults to Case Name or User Names.
  
  // Last Message Preview (for Inbox view)
  lastMessage: {
    content: string;      // Truncated preview text
    senderId: string;
    createdAt: Timestamp; // Used for sorting the inbox
    isRedacted: boolean;  // If Guardian flagged the preview as sensitive
  } | null;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;   // Primary sort key for "Most Recent"
  
  // Unread counts could be stored here or in a separate user_meta collection.
  // For simplicity in V1, we calculate client-side or use a simple map.
}

/**
 * Represents the processing status of a message by "The Guardian" AI.
 */
export type GuardianStatus = 'pending' | 'clean' | 'flagged' | 'redacted';

/**
 * Represents a single message within a channel.
 * @collection chat_channels/{channelId}/messages
 */
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  
  // Content
  content: string;        // The raw message text
  
  attachments?: {
    id: string;
    url: string;
    type: 'image' | 'document';
    name: string;
    size?: number;
    mimeType?: string;
  }[];

  // System Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp; // For edits
  
  // Read Status - Map of UserID -> Timestamp of when they read it
  readBy: {
    [uid: string]: Timestamp; 
  };

  // The Guardian Integration (PII/Risk Scanning)
  guardian: {
    status: GuardianStatus;
    flaggedReason?: string[]; // e.g., ["Phone Number", "Self-Harm Risk"]
    redactedContent?: string; // Safe version if auto-redacted
    scanTimestamp: Timestamp;
  };
}

/**
 * Input type for creating a new message.
 */
export interface CreateMessageInput {
  channelId: string;
  content: string;
  senderId: string;
  attachments?: File[]; // Client-side file objects, handled by upload service
}
