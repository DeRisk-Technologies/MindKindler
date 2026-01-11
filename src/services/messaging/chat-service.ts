// src/services/messaging/chat-service.ts

import { getRegionalDb } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc,
    updateDoc,
    Firestore,
    getDocs
} from "firebase/firestore";
import { ChatChannel, ChatMessage, GuardianEvent } from "@/types/schema";
import { evaluateEvent } from "@/ai/guardian/engine";

export class ChatService {
    private tenantId: string;
    private userId: string;
    private db: Firestore;

    constructor(tenantId: string, userId: string, shardId: string) {
        this.tenantId = tenantId;
        this.userId = userId;
        // Connect to the Regional Data Plane (PII Safe)
        const region = shardId.replace('mindkindler-', '');
        this.db = getRegionalDb(region);
    }

    /**
     * List chats for the current user.
     * Scoped to the Tenant within the Regional Shard.
     */
    subscribeToChats(callback: (chats: ChatChannel[]) => void) {
        const q = query(
            collection(this.db, `tenants/${this.tenantId}/chats`),
            where("participantIds", "array-contains", this.userId),
            orderBy("updatedAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatChannel));
            callback(chats);
        });
    }

    /**
     * Subscribe to messages in a specific chat.
     */
    subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
        const q = query(
            collection(this.db, `tenants/${this.tenantId}/chats/${chatId}/messages`),
            orderBy("createdAt", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
            callback(messages);
        });
    }

    /**
     * Send a message with Guardian Policy Check.
     */
    async sendMessage(chatId: string, content: string, type: 'text' | 'image' | 'voice' | 'file' = 'text'): Promise<{ success: boolean; error?: string }> {
        // 1. Construct Guardian Event
        const event: GuardianEvent = {
            tenantId: this.tenantId,
            eventType: 'message_send',
            subjectType: 'message',
            subjectId: chatId,
            context: {
                content: content,
                chatId: chatId,
                senderId: this.userId
            },
            actorId: this.userId,
            timestamp: new Date().toISOString()
        };

        // 2. Evaluate Policies
        const result = await evaluateEvent(event);

        if (!result.canProceed) {
            const blocker = result.blockingFindings?.[0]; // Safe access
            const msg = blocker ? `${blocker.message} (${blocker.remediation || 'Please revise.'})` : 'Action blocked by security policy.';
            return { 
                success: false, 
                error: `Blocked by Guardian: ${msg}` 
            };
        }

        // 3. Send Message (to Regional Shard)
        const messageData: Partial<ChatMessage> = {
            chatId,
            senderId: this.userId,
            content,
            type,
            readBy: [this.userId],
            deliveredTo: [this.userId],
            createdAt: new Date().toISOString()
        };

        const chatRef = doc(this.db, `tenants/${this.tenantId}/chats/${chatId}`);
        const messagesRef = collection(chatRef, "messages");

        await addDoc(messagesRef, messageData);

        // 4. Update Chat Metadata (Last Message)
        await updateDoc(chatRef, {
            lastMessage: {
                text: type === 'text' ? content : `[${type}]`,
                senderId: this.userId,
                sentAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
        });

        return { success: true };
    }

    /**
     * Create a new 1:1 or Group Chat.
     */
    async createChat(participantIds: string[], type: 'direct' | 'group', name?: string): Promise<string> {
        // Simple check for existing Direct Chat within this Tenant/Region
        if (type === 'direct' && participantIds.length === 2) {
             const q = query(
                collection(this.db, `tenants/${this.tenantId}/chats`),
                where("type", "==", "direct"),
                where("participantIds", "array-contains", this.userId)
            );
            const snapshot = await getDocs(q);
            // Client-side filter for exact match of the other participant
            const existing = snapshot.docs.find(d => {
                const data = d.data() as ChatChannel;
                return data.participantIds.every(id => participantIds.includes(id));
            });
            if (existing) return existing.id;
        }

        const chatData: Partial<ChatChannel> = {
            tenantId: this.tenantId,
            type,
            participantIds,
            name: name || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const ref = await addDoc(collection(this.db, `tenants/${this.tenantId}/chats`), chatData);
        return ref.id;
    }
}
