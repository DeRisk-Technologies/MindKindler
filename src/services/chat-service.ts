// src/services/chat-service.ts
import { db } from '@/lib/firebase';
import { 
    collection, query, where, orderBy, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { ChatChannel, ChatMessage } from '@/types/schema';

export class ChatService {
    
    /**
     * Subscribe to user's active chat channels.
     */
    static subscribeToChannels(userId: string, callback: (channels: ChatChannel[]) => void) {
        const q = query(
            collection(db, 'chats'),
            where('participantIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const channels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatChannel[];
            callback(channels);
        });
    }

    /**
     * Subscribe to messages in a specific channel.
     */
    static subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            callback(msgs);
        });
    }

    /**
     * Send a message.
     */
    static async sendMessage(
        chatId: string, 
        senderId: string, 
        content: string, 
        attachments: any[] = []
    ) {
        // 1. Add Message
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            chatId,
            senderId,
            content,
            attachments,
            type: attachments.length > 0 ? 'file' : 'text',
            readBy: [senderId],
            deliveredTo: [], // Managed by triggers
            createdAt: serverTimestamp()
        });

        // 2. Update Channel "Last Message"
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: {
                text: content,
                senderId,
                sentAt: new Date().toISOString()
            },
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Create a new direct chat or return existing one.
     */
    static async getOrCreateDirectChat(tenantId: string, userId: string, targetUserId: string): Promise<string> {
        // Check existing
        const q = query(
            collection(db, 'chats'),
            where('type', '==', 'direct'),
            where('participantIds', 'array-contains', userId)
        );
        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(d => {
            const data = d.data();
            return data.participantIds.includes(targetUserId);
        });

        if (existing) return existing.id;

        // Create new
        const ref = await addDoc(collection(db, 'chats'), {
            tenantId,
            type: 'direct',
            participantIds: [userId, targetUserId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return ref.id;
    }
}
