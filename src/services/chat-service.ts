// src/services/chat-service.ts
import { db, getRegionalDb } from '@/lib/firebase';
import { 
    collection, query, where, orderBy, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp, getDocs, Firestore
} from 'firebase/firestore';
import { ChatChannel, ChatMessage } from '@/types/schema';

export class ChatService {
    
    /**
     * Subscribe to user's active chat channels.
     * Needs to be Shard-Aware or Global? 
     * DECISION: Chats are PII-heavy (clinical discussions). Must be in Regional Shard.
     */
    static subscribeToChannels(userId: string, shardId: string, callback: (channels: ChatChannel[]) => void) {
        let targetDb: Firestore = db;
        if (shardId && shardId !== 'default') {
             targetDb = getRegionalDb(shardId.replace('mindkindler-', ''));
        }

        const q = query(
            collection(targetDb, 'chats'),
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
    static subscribeToMessages(chatId: string, shardId: string, callback: (messages: ChatMessage[]) => void) {
        let targetDb: Firestore = db;
        if (shardId && shardId !== 'default') {
             targetDb = getRegionalDb(shardId.replace('mindkindler-', ''));
        }

        const q = query(
            collection(targetDb, 'chats', chatId, 'messages'),
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
        shardId: string,
        attachments: any[] = []
    ) {
        let targetDb: Firestore = db;
        if (shardId && shardId !== 'default') {
             targetDb = getRegionalDb(shardId.replace('mindkindler-', ''));
        }

        // 1. Add Message
        await addDoc(collection(targetDb, 'chats', chatId, 'messages'), {
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
        await updateDoc(doc(targetDb, 'chats', chatId), {
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
    static async getOrCreateDirectChat(tenantId: string, userId: string, targetUserId: string, shardId: string): Promise<string> {
        let targetDb: Firestore = db;
        if (shardId && shardId !== 'default') {
             targetDb = getRegionalDb(shardId.replace('mindkindler-', ''));
        }

        // Check existing
        const q = query(
            collection(targetDb, 'chats'),
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
        const ref = await addDoc(collection(targetDb, 'chats'), {
            tenantId,
            type: 'direct',
            participantIds: [userId, targetUserId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return ref.id;
    }
}
